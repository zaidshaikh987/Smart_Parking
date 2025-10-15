"""
Billing Service for Parking Fee Calculation
"""
from datetime import datetime, timedelta
from typing import Dict
import os
import yaml
import math
import logging

logger = logging.getLogger(__name__)


class BillingService:
    """Service for calculating parking fees"""
    
    def __init__(self):
        self.config = self.load_billing_config()
        self.tariff_per_hour = self.config.get("tariff_per_hour", 10.0)
        self.billing_unit_minutes = self.config.get("billing_unit_minutes", 15)
        self.min_charge = self.config.get("min_charge", 10.0)
        self.grace_period_minutes = self.config.get("grace_period_minutes", 5)
        self.max_daily_charge = self.config.get("max_daily_charge", None)
    
    def load_billing_config(self) -> Dict:
        """Load billing configuration from file or use defaults"""
        try:
            config_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                "config",
                "billing.yaml"
            )
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = yaml.safe_load(f)
                    logger.info(f"Loaded billing config from {config_path}")
                    return config.get("billing", {})
        except Exception as e:
            logger.warning(f"Could not load billing config: {e}, using defaults")
        
        # Default configuration
        return {
            "tariff_per_hour": 10.0,
            "billing_unit_minutes": 15,
            "min_charge": 10.0,
            "grace_period_minutes": 5,
            "max_daily_charge": None
        }
    
    def calculate_duration(self, entry_time: datetime, exit_time: datetime) -> int:
        """
        Calculate parking duration in minutes
        
        Args:
            entry_time: Entry timestamp
            exit_time: Exit timestamp
            
        Returns:
            Duration in minutes
        """
        duration = exit_time - entry_time
        total_minutes = int(duration.total_seconds() / 60)
        return total_minutes
    
    def calculate_fee(self, entry_time: datetime, exit_time: datetime) -> Dict:
        """
        Calculate parking fee based on duration
        
        Args:
            entry_time: Entry timestamp
            exit_time: Exit timestamp
            
        Returns:
            Dictionary containing fee details
        """
        # Calculate total duration
        total_minutes = self.calculate_duration(entry_time, exit_time)
        
        # Apply grace period
        if total_minutes <= self.grace_period_minutes:
            return {
                "duration_minutes": total_minutes,
                "billable_minutes": 0,
                "amount": 0.0,
                "tariff_applied": self.tariff_per_hour,
                "grace_period_applied": True
            }
        
        # Calculate billable minutes (after grace period)
        billable_minutes = total_minutes - self.grace_period_minutes
        
        # Round up to nearest billing unit
        billing_units = math.ceil(billable_minutes / self.billing_unit_minutes)
        
        # Calculate base fee
        hours_charged = (billing_units * self.billing_unit_minutes) / 60
        base_amount = hours_charged * self.tariff_per_hour
        
        # Apply minimum charge
        amount = max(base_amount, self.min_charge)
        
        # Apply daily maximum if configured
        if self.max_daily_charge and amount > self.max_daily_charge:
            amount = self.max_daily_charge
        
        # Round to 2 decimal places
        amount = round(amount, 2)
        
        return {
            "duration_minutes": total_minutes,
            "billable_minutes": billable_minutes,
            "billing_units": billing_units,
            "amount": amount,
            "tariff_applied": self.tariff_per_hour,
            "min_charge_applied": amount == self.min_charge,
            "max_charge_applied": self.max_daily_charge and amount == self.max_daily_charge,
            "grace_period_applied": False
        }
    
    def format_duration(self, minutes: int) -> str:
        """
        Format duration in human-readable format
        
        Args:
            minutes: Duration in minutes
            
        Returns:
            Formatted string like "2 hours 30 minutes"
        """
        if minutes < 60:
            return f"{minutes} minute{'s' if minutes != 1 else ''}"
        
        hours = minutes // 60
        remaining_minutes = minutes % 60
        
        if remaining_minutes == 0:
            return f"{hours} hour{'s' if hours != 1 else ''}"
        
        return f"{hours} hour{'s' if hours != 1 else ''} {remaining_minutes} minute{'s' if remaining_minutes != 1 else ''}"
    
    def validate_sufficient_balance(self, balance: float, amount: float) -> bool:
        """
        Check if wallet balance is sufficient for the charge
        
        Args:
            balance: Current wallet balance
            amount: Amount to be charged
            
        Returns:
            True if sufficient, False otherwise
        """
        return balance >= amount
    
    def get_billing_info(self) -> Dict:
        """Get current billing configuration"""
        return {
            "tariff_per_hour": self.tariff_per_hour,
            "billing_unit_minutes": self.billing_unit_minutes,
            "min_charge": self.min_charge,
            "grace_period_minutes": self.grace_period_minutes,
            "max_daily_charge": self.max_daily_charge
        }


# Global billing service instance
billing_service = BillingService()
