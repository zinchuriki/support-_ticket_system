from rest_framework import serializers
from.models import Ticket

class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['created_at']
        
    def validate_category(self, value):
        """Additional validation to ensure category is within valid choices"""
        if value not in Ticket.Category.values:
            raise serializers.ValidationError("Invalid category.")
        return value