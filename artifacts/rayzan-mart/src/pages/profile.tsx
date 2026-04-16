import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetMyProfile, useUpdateMyProfile } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { User, Star } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) { setLocation("/login"); return null; }

  const { data: profile, isLoading, refetch } = useGetMyProfile({ query: {} });
  const updateProfile = useUpdateMyProfile();

  const [form, setForm] = useState({
    name: "", phone: "", address: "", city: "", district: "",
    dateOfBirth: "", occupation: "", nid: "", paymentMethod: "", paymentNumber: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: (profile as any).name ?? "",
        phone: (profile as any).phone ?? "",
        address: (profile as any).address ?? "",
        city: (profile as any).city ?? "",
        district: (profile as any).district ?? "",
        dateOfBirth: (profile as any).dateOfBirth ?? "",
        occupation: (profile as any).occupation ?? "",
        nid: (profile as any).nid ?? "",
        paymentMethod: (profile as any).paymentMethod ?? "",
        paymentNumber: (profile as any).paymentNumber ?? "",
      });
    }
  }, [profile]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate({ data: form }, {
      onSuccess: () => { toast.success("Profile updated!"); refetch(); },
      onError: () => toast.error("Failed to update profile"),
    });
  }

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
            <User className="w-10 h-10 text-secondary" />
          </div>
          <p className="font-bold text-foreground">{(profile as any)?.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center">
          <Star className="w-8 h-8 text-yellow-500 mb-2" />
          <p className="text-3xl font-bold text-foreground">{(profile as any)?.loyaltyPoints ?? 0}</p>
          <p className="text-sm text-muted-foreground">Loyalty Points</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-1">Member since</p>
          <p className="font-bold text-foreground">{new Date((profile as any)?.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-bold text-foreground mb-4">Edit Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Full Name", field: "name", required: true },
            { label: "Phone", field: "phone" },
            { label: "Address", field: "address" },
            { label: "City", field: "city" },
            { label: "District", field: "district" },
            { label: "Date of Birth", field: "dateOfBirth", type: "date" },
            { label: "Occupation", field: "occupation" },
            { label: "NID Number", field: "nid" },
            { label: "Payment Method (bKash/Nagad)", field: "paymentMethod" },
            { label: "Payment Number", field: "paymentNumber" },
          ].map(({ label, field, type = "text", required }) => (
            <div key={field}>
              <Label>{label}{required && " *"}</Label>
              <Input
                type={type}
                value={(form as any)[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                required={required}
                className="mt-1"
              />
            </div>
          ))}
        </div>
        <Button type="submit" className="mt-6 bg-secondary hover:bg-green-700 text-white" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
