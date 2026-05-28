import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  UserCheck,
  ArrowRight,
  Loader2,
  Eye,
} from "lucide-react";

interface CoModFamily {
  family_id: string;
  family_name: string;
  organization_id: string | null;
  organization_name: string | null;
  display_label: string;
  granted_at: string;
  member_count: number;
}

export function CoModeratorFamiliesPanel() {
  const navigate = useNavigate();
  const [families, setFamilies] = useState<CoModFamily[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCoModFamilies();
  }, []);

  const fetchCoModFamilies = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("get_co_moderated_families", {
        _user_id: user.id,
      });

      if (error) throw error;
      setFamilies((data as CoModFamily[]) || []);
    } catch (err) {
      console.error("Error loading co-moderated families:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div className="text-center p-8 text-sm text-muted-foreground">
        <UserCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
        <p>You're not co-moderating any families yet.</p>
        <p className="mt-1 text-xs">
          When you transfer a family and choose to stay on, it'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
        <UserCheck className="h-4 w-4" />
        <span>
          You have <strong>view + participation access</strong> to these families. 
          The primary provider manages each group.
        </span>
      </div>

      {families.map((f) => (
        <Card key={f.family_id} className="border-l-4 border-l-blue-400">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{f.family_name}</CardTitle>
                <CardDescription className="mt-0.5 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {f.organization_name || "Independent"}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-300 whitespace-nowrap">
                <UserCheck className="h-3 w-3 mr-1" />
                {f.display_label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{f.member_count} members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span>
                  Co-mod since{" "}
                  {new Date(f.granted_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/family/${f.family_id}`)}
            >
              Open Family Group
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
