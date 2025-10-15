"""
Payment Service - Razorpay Integration
Handles online payments for wallet top-ups
"""
import os
import hmac
import hashlib
import logging
from typing import Dict, Optional
import razorpay

logger = logging.getLogger(__name__)


class PaymentService:
    """Payment service using Razorpay"""
    
    def __init__(self):
        """Initialize Razorpay client"""
        # Get credentials from environment
        self.key_id = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_YOUR_KEY_ID')
        self.key_secret = os.getenv('RAZORPAY_KEY_SECRET', 'YOUR_KEY_SECRET')
        
        # Initialize client
        try:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            logger.info("Razorpay payment service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Razorpay: {e}")
            self.client = None
    
    def create_order(self, amount: float, receipt_id: str, notes: Dict = None) -> Optional[Dict]:
        """
        Create Razorpay order for payment
        
        Args:
            amount: Amount in rupees
            receipt_id: Unique receipt ID
            notes: Additional notes
            
        Returns:
            Order details or None
        """
        if not self.client:
            logger.error("Razorpay client not initialized")
            return None
        
        try:
            # Convert to paise (Razorpay uses paise)
            amount_paise = int(amount * 100)
            
            order_data = {
                'amount': amount_paise,
                'currency': 'INR',
                'receipt': receipt_id,
                'notes': notes or {}
            }
            
            order = self.client.order.create(data=order_data)
            logger.info(f"Created Razorpay order: {order['id']}")
            
            return {
                'order_id': order['id'],
                'amount': amount,
                'currency': 'INR',
                'key_id': self.key_id
            }
        
        except Exception as e:
            logger.error(f"Failed to create order: {e}")
            return None
    
    def verify_payment(self, razorpay_order_id: str, razorpay_payment_id: str, 
                      razorpay_signature: str) -> bool:
        """
        Verify payment signature
        
        Args:
            razorpay_order_id: Order ID
            razorpay_payment_id: Payment ID
            razorpay_signature: Signature from Razorpay
            
        Returns:
            True if signature is valid
        """
        try:
            # Generate signature
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            generated_signature = hmac.new(
                self.key_secret.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            is_valid = hmac.compare_digest(generated_signature, razorpay_signature)
            
            if is_valid:
                logger.info(f"Payment verified successfully: {razorpay_payment_id}")
            else:
                logger.warning(f"Invalid payment signature: {razorpay_payment_id}")
            
            return is_valid
        
        except Exception as e:
            logger.error(f"Error verifying payment: {e}")
            return False
    
    def get_payment_details(self, payment_id: str) -> Optional[Dict]:
        """
        Get payment details from Razorpay
        
        Args:
            payment_id: Payment ID
            
        Returns:
            Payment details or None
        """
        if not self.client:
            return None
        
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            logger.error(f"Failed to fetch payment: {e}")
            return None
    
    def create_refund(self, payment_id: str, amount: Optional[float] = None) -> Optional[Dict]:
        """
        Create refund for a payment
        
        Args:
            payment_id: Payment ID to refund
            amount: Amount to refund (None for full refund)
            
        Returns:
            Refund details or None
        """
        if not self.client:
            return None
        
        try:
            refund_data = {}
            if amount:
                refund_data['amount'] = int(amount * 100)
            
            refund = self.client.payment.refund(payment_id, refund_data)
            logger.info(f"Created refund: {refund['id']}")
            return refund
        
        except Exception as e:
            logger.error(f"Failed to create refund: {e}")
            return None
    
    def simulate_payment(self, amount: float) -> Dict:
        """
        Simulate successful payment (for testing without Razorpay)
        
        Args:
            amount: Amount in rupees
            
        Returns:
            Simulated payment details
        """
        import uuid
        import time
        
        return {
            'order_id': f"order_sim_{int(time.time())}",
            'payment_id': f"pay_sim_{uuid.uuid4().hex[:16]}",
            'amount': amount,
            'status': 'captured',
            'method': 'simulated',
            'created_at': int(time.time())
        }


# Global payment service instance
payment_service = PaymentService()
