import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Make sure to call loadStripe outside of a component's render
// to avoid recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm({ rewardId, rewardTitle, rewardDescription, onSuccess }: {
  rewardId: number;
  rewardTitle: string;
  rewardDescription: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    shippingName: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    shippingCountry: "US"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      // First redeem the reward and get the payment intent
      const response = await apiRequest("POST", `/api/rewards/${rewardId}/redeem`, shippingInfo);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong");
      }
      
      const { clientSecret, isPhysicalReward } = await response.json();

      // If it's a physical reward that requires confirmation
      if (isPhysicalReward && clientSecret) {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + "/rewards",
          },
          redirect: "if_required"
        });

        if (error) {
          toast({
            title: "Payment Error",
            description: error.message || "An error occurred during payment confirmation.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Reward Redeemed!",
            description: "Your physical reward has been redeemed successfully. Check your email for details.",
          });
          onSuccess();
        }
      } else {
        // Digital reward - automatically successful
        toast({
          title: "Reward Redeemed!",
          description: "Your reward has been added to your inventory.",
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to redeem reward",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <CardTitle className="mb-2">Shipping Information</CardTitle>
        <CardDescription className="mb-4">
          Please provide your shipping details to receive your physical reward.
        </CardDescription>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="shippingName">Full Name</Label>
            <Input 
              id="shippingName" 
              name="shippingName" 
              value={shippingInfo.shippingName} 
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="shippingAddress">Address</Label>
            <Input 
              id="shippingAddress" 
              name="shippingAddress" 
              value={shippingInfo.shippingAddress} 
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingCity">City</Label>
              <Input 
                id="shippingCity" 
                name="shippingCity" 
                value={shippingInfo.shippingCity} 
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingState">State/Province</Label>
              <Input 
                id="shippingState" 
                name="shippingState" 
                value={shippingInfo.shippingState} 
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingZip">ZIP/Postal Code</Label>
              <Input 
                id="shippingZip" 
                name="shippingZip" 
                value={shippingInfo.shippingZip} 
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingCountry">Country</Label>
              <Input 
                id="shippingCountry" 
                name="shippingCountry" 
                value={shippingInfo.shippingCountry} 
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <CardTitle className="mb-2">Payment Details</CardTitle>
        <CardDescription className="mb-4">
          Your reward is already paid for with your earned points.
          We just need to collect your payment information for verification.
        </CardDescription>
        
        <PaymentElement />
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/rewards">Cancel</Link>
        </Button>
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? "Processing..." : "Complete Redemption"}
        </Button>
      </div>
    </form>
  );
}

export default function Checkout() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const rewardId = Number(searchParams.get("rewardId") || "0");
  const rewardTitle = searchParams.get("title") || "";
  const rewardDescription = searchParams.get("description") || "";
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!rewardId) {
      toast({
        title: "Invalid Reward",
        description: "No reward selected for checkout.",
        variant: "destructive"
      });
      setLocation("/rewards");
      return;
    }

    // Create a PaymentIntent as soon as the page loads
    const getPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { rewardId });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Something went wrong");
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to initialize checkout",
          variant: "destructive"
        });
        setLocation("/rewards");
      }
    };

    getPaymentIntent();
  }, [rewardId, setLocation, toast]);

  const handleSuccess = () => {
    setLocation("/rewards");
  };

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Checkout - {rewardTitle}</CardTitle>
          <CardDescription>{rewardDescription}</CardDescription>
        </CardHeader>
        
        <CardContent>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                rewardId={rewardId} 
                rewardTitle={rewardTitle}
                rewardDescription={rewardDescription}
                onSuccess={handleSuccess} 
              />
            </Elements>
          ) : (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="text-sm text-muted-foreground">
          <p>Your points have already been deducted for this reward. If you cancel, your points will be refunded.</p>
        </CardFooter>
      </Card>
    </div>
  );
}