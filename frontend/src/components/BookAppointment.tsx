import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, Phone, Building2, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const BookAppointment = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    specialty: "",
    notes: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const specialties = [
    "General Physician",
    "Cardiologist",
    "Dermatologist",
    "Orthopedic",
    "Pediatrician",
    "ENT Specialist",
    "Gynecologist",
    "Neurologist"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.date || !formData.time || !formData.specialty) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    setSubmitted(true);
    toast({
      title: "Appointment requested",
      description: "We'll confirm your appointment shortly via SMS/call",
    });
  };

  if (submitted) {
    return (
      <div className="space-y-4 text-center py-8">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Appointment Requested</h3>
          <p className="text-sm text-gray-600 mt-2">
            We'll call you at <span className="font-semibold">{formData.phone}</span> to confirm your appointment.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Preferred: {formData.date} at {formData.time} - {formData.specialty}
          </p>
        </div>
        <Button onClick={() => setSubmitted(false)} variant="outline">
          Book Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-semibold">Book a doctor appointment</p>
        <p className="text-xs mt-1">Fill the form below and we'll confirm your slot</p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" /> Full Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="w-4 h-4" /> Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 XXXXX XXXXX"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="time" className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Time *
            </Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="specialty" className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Specialty *
          </Label>
          <select
            id="specialty"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select a specialty</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm font-medium">
            Additional Notes (Optional)
          </Label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any specific concerns or symptoms"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
          />
        </div>
      </div>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
        Request Appointment
      </Button>
    </form>
  );
};

export default BookAppointment;
