import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Prospects from "@/pages/prospects";
import Inbox from "@/pages/inbox";
import Leads from "@/pages/leads";
import Campaigns from "@/pages/campaigns";
import Profile from "@/pages/profile";
import Account from "@/pages/account";
import Notifications from "@/pages/notifications";
import CustomerSite from "@/pages/customer-site";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/prospects" component={Prospects} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/leads" component={Leads} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/profile" component={Profile} />
      <Route path="/account" component={Account} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/customer-example" component={CustomerSite} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
