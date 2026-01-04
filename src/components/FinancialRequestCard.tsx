import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  ChevronDown,
  FileText,
  Paperclip,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DENIAL_REASONS = [
  { value: 'boundary', label: 'Violates a current boundary' },
  { value: 'values', label: "Doesn't align with family values or goals" },
  { value: 'info', label: 'Need more information or clarity' },
];

interface Pledge {
  name: string;
  amount: number;
}

interface FinancialRequestCardProps {
  id: string;
  requester: string;
  requesterInitials: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  createdAt: string;
  votes: { approve: number; deny: number };
  pledges: Pledge[];
  attachmentUrl?: string;
  attachmentCaption?: string;
  fundsReceived?: boolean;
  fundsReceivedAt?: string;
  branding?: { primaryColor?: string };
  isDemo?: boolean;
  children?: React.ReactNode;
}

const DemoPendingActions: React.FC<{ branding?: { primaryColor?: string } }> = ({ branding }) => {
  const [showDenyReason, setShowDenyReason] = useState(false);
  const [denyReason, setDenyReason] = useState<string>('');

  const handleDenyClick = () => {
    setShowDenyReason(true);
  };

  const handleConfirmDeny = () => {
    if (denyReason) {
      setShowDenyReason(false);
      setDenyReason('');
    }
  };

  if (showDenyReason) {
    return (
      <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-100">
        <p className="text-sm font-medium text-red-700">Select a reason for denial:</p>
        <Select value={denyReason} onValueChange={setDenyReason}>
          <SelectTrigger className="w-full bg-white border-red-200">
            <SelectValue placeholder="Choose a reason..." />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {DENIAL_REASONS.map((reason) => (
              <SelectItem key={reason.value} value={reason.value}>
                {reason.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 pt-1">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              setShowDenyReason(false);
              setDenyReason('');
            }}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            disabled={!denyReason}
            onClick={handleConfirmDeny}
          >
            <ThumbsDown className="h-3 w-3 mr-1" />
            Confirm Denial
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button 
        size="sm" 
        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        style={branding?.primaryColor ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColor}cc)` } : undefined}
      >
        <ThumbsUp className="h-3 w-3 mr-1" />
        Approve
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
        onClick={handleDenyClick}
      >
        <ThumbsDown className="h-3 w-3 mr-1" />
        Deny
      </Button>
    </div>
  );
};

export const FinancialRequestCard: React.FC<FinancialRequestCardProps> = ({
  requester,
  requesterInitials,
  amount,
  reason,
  status,
  createdAt,
  votes,
  pledges,
  attachmentUrl,
  attachmentCaption,
  fundsReceived,
  fundsReceivedAt,
  branding,
  isDemo = false,
  children
}) => {
  const isClosed = status === 'completed' || status === 'denied' || (status === 'approved' && fundsReceived);
  const [isOpen, setIsOpen] = useState(!isClosed);

  const statusColor = status === 'completed' 
    ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
    : status === 'approved' 
      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
      : status === 'denied'
        ? 'bg-gradient-to-r from-red-500 to-rose-500'
        : 'bg-gradient-to-r from-amber-500 to-orange-500';

  const badgeClass = status === 'completed' 
    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border-0 text-white' 
    : status === 'approved' 
      ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-0 text-white' 
      : status === 'denied'
        ? 'bg-destructive text-destructive-foreground'
        : 'bg-amber-100 text-amber-700 border-amber-200';

  const CompactHeader = () => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar className="h-7 w-7 ring-2 ring-primary/20 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-[10px]">
            {requesterInitials}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm truncate">{requester}</span>
        <span className="font-bold text-primary text-sm shrink-0">${amount.toFixed(2)}</span>
        <Badge 
          variant="secondary"
          className={cn("text-[10px] px-1.5 py-0 shrink-0", badgeClass)}
        >
          {status === 'completed' || status === 'approved' ? <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> : status === 'denied' ? null : <Clock className="h-2.5 w-2.5 mr-0.5" />}
          {status}
        </Badge>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground hidden sm:inline">{createdAt}</span>
        {isClosed && (
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        )}
      </div>
    </div>
  );

  const FullContent = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{reason}</p>

      {attachmentUrl && (
        <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-muted/50 px-3 py-1.5 border-b flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">Attached Document</span>
            <Paperclip className="h-2.5 w-2.5 text-muted-foreground ml-auto" />
          </div>
          <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img 
              src={attachmentUrl} 
              alt="Attachment" 
              className="w-full max-h-40 object-contain bg-white cursor-pointer hover:opacity-90 transition-opacity"
            />
          </a>
          {attachmentCaption && (
            <div className="bg-muted/20 px-3 py-1.5 border-t">
              <p className="text-[10px] text-muted-foreground">{attachmentCaption}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 p-2 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-1.5 text-green-600">
          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
            <ThumbsUp className="h-3 w-3" />
          </div>
          <span className="text-sm font-bold">{votes.approve}</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-500">
          <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
            <ThumbsDown className="h-3 w-3" />
          </div>
          <span className="text-sm font-bold">{votes.deny}</span>
        </div>
      </div>

      {pledges.length > 0 && (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-3 border border-primary/10">
          <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Pledges ({pledges.length})
          </p>
          <div className="space-y-1">
            {pledges.map((pledge, i) => (
              <div key={i} className="flex justify-between items-center text-xs bg-background/60 rounded px-2 py-1">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px] bg-muted">
                      {pledge.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{pledge.name}</span>
                </div>
                <span className="font-bold text-primary">${pledge.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fundsReceived && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700">
            <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-sm">Funds Received</span>
              {fundsReceivedAt && (
                <p className="text-[10px] text-green-600">{requester} confirmed • {fundsReceivedAt}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {status === 'completed' && !fundsReceived && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700">
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-sm">Request Completed</span>
              <p className="text-[10px] text-blue-600">Fully processed and closed</p>
            </div>
          </div>
        </div>
      )}

      {isDemo && status === 'pending' && (
        <DemoPendingActions branding={branding} />
      )}

      {children}
    </div>
  );

  if (isClosed) {
    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className={cn("h-0.5", statusColor)} />
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardContent className="py-3 cursor-pointer hover:bg-muted/30 transition-colors">
              <CompactHeader />
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-3">
              <FullContent />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <div className={cn("h-1", statusColor)} />
      <CardContent className="py-3">
        <div className="mb-3">
          <CompactHeader />
        </div>
        <FullContent />
      </CardContent>
    </Card>
  );
};
