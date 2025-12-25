import { Button } from "@/components/ui/button";
import { Ambulance, Droplets, Pill, Camera, Building2, MapPin, CalendarCheck, Truck, PanelLeftOpen } from "lucide-react";

interface ActionSidebarProps {
  onAmbulance: () => void;
  onBloodBank: () => void;
  onJanAushadhi: () => void;
  onScanPrescription: () => void;
  onNearbyHospitals: () => void;
  onNearbyPharmacies: () => void;
  onBookAppointment: () => void;
  onMedicineDelivery: () => void;
}

const ActionSidebar = ({
  onAmbulance,
  onBloodBank,
  onJanAushadhi,
  onScanPrescription,
  onNearbyHospitals,
  onNearbyPharmacies,
  onBookAppointment,
  onMedicineDelivery,
}: ActionSidebarProps) => {

  const items = [
    { label: "Ambulance", icon: <Ambulance className="w-4 h-4" />, onClick: onAmbulance, accent: "red" },
    { label: "Blood Bank", icon: <Droplets className="w-4 h-4" />, onClick: onBloodBank, accent: "rose" },
    { label: "Jan Aushadhi", icon: <Pill className="w-4 h-4" />, onClick: onJanAushadhi, accent: "emerald" },
    { label: "Scan Prescription", icon: <Camera className="w-4 h-4" />, onClick: onScanPrescription, accent: "primary" },
    { label: "Nearby Hospitals", icon: <Building2 className="w-4 h-4" />, onClick: onNearbyHospitals, accent: "primary" },
    { label: "Nearby Pharmacies", icon: <MapPin className="w-4 h-4" />, onClick: onNearbyPharmacies, accent: "primary" },
    { label: "Book Appointment", icon: <CalendarCheck className="w-4 h-4" />, onClick: onBookAppointment, accent: "blue" },
    { label: "Medicine Delivery", icon: <Truck className="w-4 h-4" />, onClick: onMedicineDelivery, accent: "emerald" },
  ];

  const accentClass = (accent?: string) => {
    switch (accent) {
      case "red":
        return "border-red-400 text-red-700 hover:bg-red-50";
      case "rose":
        return "border-rose-400 text-rose-700 hover:bg-rose-50";
      case "emerald":
        return "border-emerald-400 text-emerald-700 hover:bg-emerald-50";
      case "blue":
        return "border-blue-400 text-blue-700 hover:bg-blue-50";
      case "primary":
        return "border-primary/70 text-primary hover:bg-primary/10";
      default:
        return "border-gray-300 text-gray-700 hover:bg-gray-50";
    }
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30 w-[232px]">
      <div className="rounded-2xl shadow-xl border border-gray-200 bg-white/90 backdrop-blur-md overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary">
            <PanelLeftOpen className="w-4 h-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-800 leading-none">Quick Actions</span>
            <span className="text-[10px] text-gray-400">Tools & helpers</span>
          </div>
        </div>

        <div id="action-sidebar-panel" className="p-2 space-y-1.5">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={it.onClick}
              className={`w-full inline-flex items-center gap-2 px-3 h-9 text-xs font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${accentClass(it.accent)}`}
              aria-label={it.label}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-700">
                {it.icon}
              </span>
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActionSidebar;
