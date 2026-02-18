from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Min, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.conf import settings
import openai
import json
import os

from .models import Ticket
from .serializers import TicketSerializer


# --- Section 4: CRUD API ---
class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["category", "priority", "status"]
    search_fields = ["title", "description"]


# --- Section 5: Analytics Engine ---
class TicketStatsView(APIView):
    def get(self, request):
        # Database-level aggregation (No Python Loops for counting)
        stats = Ticket.objects.aggregate(
            total=Count("id"),
            open_count=Count("id", filter=Q(status="open")),
            first_created=Min("created_at"),
        )

        total_tickets = stats["total"] or 0

        # Calculate Average Per Day
        avg_per_day = 0
        if total_tickets > 0 and stats["first_created"]:
            days_active = (timezone.now() - stats["first_created"]).days + 1
            avg_per_day = total_tickets / days_active

        # Grouped Metrics
        p_data = Ticket.objects.values("priority").annotate(count=Count("id"))
        c_data = Ticket.objects.values("category").annotate(count=Count("id"))

        # Convert QuerySets to Dictionaries
        priority_breakdown = {item["priority"]: item["count"] for item in p_data}
        category_breakdown = {item["category"]: item["count"] for item in c_data}

        # Zero-fill for frontend consistency (Permissible Python loop over static choices)
        for choice in Ticket.Priority.values:
            priority_breakdown.setdefault(choice, 0)
        for choice in Ticket.Category.values:
            category_breakdown.setdefault(choice, 0)

        return Response(
            {
                "total_tickets": total_tickets,
                "open_tickets": stats["open_count"] or 0,
                "avg_tickets_per_day": round(avg_per_day, 2),
                "priority_breakdown": priority_breakdown,
                "category_breakdown": category_breakdown,
            }
        )


# --- Section 6: AI Integration ---
class AIClassifyView(APIView):
    def post(self, request):
        description = request.data.get("description", "")
        if not description:
            return Response({"error": "Description required"}, status=400)

        client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        system_prompt = """
        You are an IT support triage assistant. Classify the ticket.
        Categories: billing, technical, account, general.
        Priorities: critical (outage), high (broken feature), medium (nuisance), low (typo).
        Return JSON: {"suggested_category": "...", "suggested_priority": "..."}
        """

        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": description},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            content = json.loads(response.choices[0].message.content)
            return Response(content)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
