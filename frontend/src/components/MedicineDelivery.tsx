import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, MapPin, Phone, Package, Upload, CheckCircle2, Clock, MapPinned } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const MedicineDelivery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: "",
    medicines: "",
    prescription: null as File | null
  });
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Prescription image must be under 5MB",
          variant: "destructive"
        });
        return;
      }
      setFormData({ ...formData, prescription: file });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address || !formData.medicines) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Generate order ID (in real app, this would come from backend)
    const newOrderId = `ORD-${Date.now()}`;
    setOrderId(newOrderId);
    setSubmitted(true);
    
    toast({
      title: "Order placed successfully",
      description: "Your medicines will be delivered within 1-2 hours",
    });
  };

  const handleTrackOrder = () => {
    // For demo: using test driver ID. In production, backend assigns driver
    const driverId = "DRV-TEST-001";
    const userId = user?.email || "guest-user";
    navigate(`/tracking/${orderId}/${driverId}/${userId}`);
  };

  if (submitted) {
    return (
      <div className="space-y-4 text-center py-8">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Order Confirmed</h3>
          <p className="text-sm text-gray-600 mt-2">
            Order ID: <span className="font-mono font-semibold text-emerald-600">{orderId}</span>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Your medicines will be delivered to:
          </p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            {formData.address}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Estimated delivery: 1-2 hours</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            We'll call you at {formData.phone} for confirmation
          </p>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={handleTrackOrder} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <MapPinned className="w-4 h-4" />
            Track Order in Real-Time
          </Button>
          
          <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full">
            Place Another Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          <div>
            <p className="font-semibold">Fast Medicine Delivery</p>
            <p className="text-xs mt-1">Get your medicines delivered to your doorstep in 1-2 hours</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="delivery-name" className="text-sm font-medium flex items-center gap-2">
            Full Name *
          </Label>
          <Input
            id="delivery-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <Label htmlFor="delivery-phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="w-4 h-4" /> Phone Number *
          </Label>
          <Input
            id="delivery-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 XXXXX XXXXX"
            required
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Delivery Address *
          </Label>
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="House no., Street, Area, Landmark"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
            required
          />
        </div>

        <div>
          <Label htmlFor="pincode" className="text-sm font-medium">
            Pincode
          </Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            placeholder="400053"
            maxLength={6}
          />
        </div>

        <div>
          <Label htmlFor="medicines" className="text-sm font-medium flex items-center gap-2">
            <Package className="w-4 h-4" /> Medicine List *
          </Label>
          <textarea
            id="medicines"
            value={formData.medicines}
            onChange={(e) => setFormData({ ...formData, medicines: e.target.value })}
            placeholder="List the medicines you need (e.g., Paracetamol 500mg - 10 tablets)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
            required
          />
        </div>

        <div>
          <Label htmlFor="prescription" className="text-sm font-medium flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Prescription (Optional)
          </Label>
          <Input
            id="prescription"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          {formData.prescription && (
            <p className="text-xs text-green-600 mt-1">
              ✓ {formData.prescription.name}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">For prescription medicines, upload is recommended</p>
        </div>
      </div>

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
        <Truck className="w-4 h-4" />
        Place Order
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Payment on delivery • Free delivery on orders above ₹500
      </p>
    </form>
  );
};

export default MedicineDelivery;
