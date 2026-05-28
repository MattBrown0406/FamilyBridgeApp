import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  Loader2,
  ChevronDown,
  X,
  Mail,
  UserPlus,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  website_url?: string | null;
}

export interface OrgSelection {
  type: "existing";
  org: Organization;
}

export interface OrgInviteSelection {
  type: "invite";
  orgName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

export type OrgComboboxValue = OrgSelection | OrgInviteSelection | null;

interface OrgSearchComboboxProps {
  excludeOrgId?: string;
  value: OrgComboboxValue;
  onChange: (value: OrgComboboxValue) => void;
  label?: string;
  placeholder?: string;
}

export function OrgSearchCombobox({
  excludeOrgId,
  value,
  onChange,
  label = "Receiving Organization",
  placeholder = "Search by name...",
}: OrgSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Organization[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Invite form state
  const [inviteOrgName, setInviteOrgName] = useState("");
  const [inviteContactName, setInviteContactName] = useState("");
  const [inviteContactEmail, setInviteContactEmail] = useState("");
  const [inviteContactPhone, setInviteContactPhone] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search orgs as user types
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        let q = supabase
          .from("organizations")
          .select("id, name, subdomain, website_url")
          .ilike("name", `%${query}%`)
          .order("name")
          .limit(8);

        if (excludeOrgId) q = q.neq("id", excludeOrgId);

        const { data } = await q;
        setResults(data || []);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, excludeOrgId]);

  const handleSelect = (org: Organization) => {
    onChange({ type: "existing", org });
    setQuery("");
    setIsOpen(false);
    setShowInviteForm(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setShowInviteForm(false);
  };

  const handleInviteConfirm = () => {
    if (!inviteOrgName || !inviteContactEmail) return;
    onChange({
      type: "invite",
      orgName: inviteOrgName,
      contactName: inviteContactName,
      contactEmail: inviteContactEmail,
      contactPhone: inviteContactPhone || undefined,
    });
    setIsOpen(false);
    setShowInviteForm(false);
  };

  // If a value is selected, show the selection chip
  if (value) {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          {value.type === "existing" ? (
            <>
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-sm flex-1">{value.org.name}</span>
              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                On FamilyBridge
              </Badge>
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">{value.orgName}</p>
                <p className="text-xs text-muted-foreground">{value.contactEmail} — invite will be sent</p>
              </div>
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                Invite pending
              </Badge>
            </>
          )}
          <button
            onClick={handleClear}
            className="text-muted-foreground hover:text-destructive ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1" ref={containerRef}>
      <Label>{label}</Label>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9 pr-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setShowInviteForm(false);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isSearching ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full max-w-sm bg-background border rounded-lg shadow-lg overflow-hidden mt-1">
          {/* Results list */}
          {results.length > 0 && (
            <ul className="max-h-48 overflow-y-auto divide-y">
              {results.map((org) => (
                <li key={org.id}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors"
                    onClick={() => handleSelect(org)}
                  >
                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{org.name}</p>
                      {org.website_url && (
                        <p className="text-xs text-muted-foreground">{org.website_url}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* No results + invite option */}
          {query.length >= 2 && results.length === 0 && !isSearching && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No programs found for <span className="font-medium">"{query}"</span>.
            </div>
          )}

          {/* Invite section (always shown when there's a query) */}
          {query.length >= 2 && !isSearching && (
            <div className="border-t bg-amber-50/50">
              {!showInviteForm ? (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-100/50 text-left transition-colors"
                  onClick={() => {
                    setShowInviteForm(true);
                    setInviteOrgName(query);
                  }}
                >
                  <UserPlus className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Invite a program to FamilyBridge
                    </p>
                    <p className="text-xs text-amber-600">
                      Send them a subscription link — family transfers once they register.
                    </p>
                  </div>
                </button>
              ) : (
                <div className="px-4 py-3 space-y-3">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                    Invite Details
                  </p>
                  <div className="space-y-2">
                    <Input
                      placeholder="Program name *"
                      value={inviteOrgName}
                      onChange={(e) => setInviteOrgName(e.target.value)}
                      className="text-sm h-8"
                    />
                    <Input
                      placeholder="Contact name"
                      value={inviteContactName}
                      onChange={(e) => setInviteContactName(e.target.value)}
                      className="text-sm h-8"
                    />
                    <Input
                      placeholder="Contact email *"
                      type="email"
                      value={inviteContactEmail}
                      onChange={(e) => setInviteContactEmail(e.target.value)}
                      className="text-sm h-8"
                    />
                    <Input
                      placeholder="Contact phone (optional)"
                      value={inviteContactPhone}
                      onChange={(e) => setInviteContactPhone(e.target.value)}
                      className="text-sm h-8"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={handleInviteConfirm}
                      disabled={!inviteOrgName || !inviteContactEmail}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Send Invite
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setShowInviteForm(false)}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
