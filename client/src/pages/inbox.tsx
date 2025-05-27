import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Paperclip, 
  Send, 
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
  Image,
  FileText
} from "lucide-react";
import { useState } from "react";
import type { Business } from "@shared/schema";

export default function Inbox() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("messages");

  const { data: businesses } = useQuery({
    queryKey: ["/api/businesses"],
    queryFn: api.getBusinesses,
  });

  // Mock conversation data for demonstration
  const getConversations = (business: Business) => [
    {
      id: 1,
      type: "sms",
      direction: "outbound",
      message: `Hi ${business.name.split(' ')[0]}, I noticed ${business.name} doesn't have a website. I'm local and can get one built for just $400 with free setup. Want the details?`,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "delivered"
    },
    {
      id: 2,
      type: "sms",
      direction: "inbound",
      message: "Hi there! Yes, we've been thinking about getting a website. Can you tell me more about what's included?",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: "read"
    },
    {
      id: 3,
      type: "sms",
      direction: "outbound",
      message: "Great! I'd love to show you some examples of sites I've built for other auto shops in Maine. Are you free for a quick 15-min call tomorrow?",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "delivered"
    }
  ];

  const getUpcomingMeetings = () => [
    {
      id: 1,
      businessId: 2,
      businessName: "Bath Plumbing Co",
      type: "call",
      datetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      duration: 30,
      status: "scheduled",
      notes: "Demo website examples, discuss pricing"
    },
    {
      id: 2,
      businessId: 3,
      businessName: "Coastal Electric",
      type: "video",
      datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      duration: 15,
      status: "confirmed",
      notes: "Show electrical contractor templates"
    }
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "text-green-600";
      case "read": return "text-blue-600";
      case "pending": return "text-yellow-600";
      default: return "text-gray-600";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Globe className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-xl text-gray-900">LocalBiz Pro</span>
            </a>
            <div className="hidden md:flex space-x-6 ml-8">
              <a href="/" className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/prospects" className="text-gray-600 hover:text-gray-900">Prospects</a>
              <a href="#" className="text-primary border-b-2 border-primary pb-2 font-medium">Inbox</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Templates</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Analytics</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          
          {/* Sidebar - Business List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Active Conversations</h2>
              <Input 
                placeholder="Search conversations..." 
                className="mt-3"
              />
            </div>
            <div className="overflow-y-auto h-full">
              {businesses?.map((business) => {
                const conversations = getConversations(business);
                const lastMessage = conversations[conversations.length - 1];
                
                return (
                  <div
                    key={business.id}
                    onClick={() => setSelectedBusiness(business)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedBusiness?.id === business.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(business.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {business.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(lastMessage.timestamp)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {lastMessage.direction === 'inbound' ? '' : 'You: '}
                          {lastMessage.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={`text-xs ${
                            business.stage === 'interested' ? 'bg-yellow-100 text-yellow-700' :
                            business.stage === 'sold' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {business.stage}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            {lastMessage.direction === 'outbound' && (
                              <CheckCircle className={`w-3 h-3 ${getStatusColor(lastMessage.status)}`} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border flex flex-col">
            {selectedBusiness ? (
              <>
                {/* Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(selectedBusiness.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{selectedBusiness.name}</h3>
                        <p className="text-sm text-gray-600">{selectedBusiness.city}, {selectedBusiness.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline">
                        <Video className="w-4 h-4 mr-1" />
                        Video
                      </Button>
                      <Button size="sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="w-full justify-start px-4 pt-4 bg-transparent">
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="meetings">Meetings</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="messages" className="flex-1 flex flex-col p-4">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {getConversations(selectedBusiness).map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.direction === 'outbound'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <div className={`flex items-center justify-between mt-1 ${
                              message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">{formatTimeAgo(message.timestamp)}</span>
                              {message.direction === 'outbound' && (
                                <CheckCircle className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="border-t pt-4">
                      <div className="flex items-end space-x-2">
                        <Button variant="outline" size="sm">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Image className="w-4 h-4" />
                        </Button>
                        <Textarea
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 min-h-0 resize-none"
                          rows={2}
                        />
                        <Button>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="meetings" className="flex-1 p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium">Upcoming Meetings</h4>
                        <Button size="sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          Schedule New
                        </Button>
                      </div>
                      
                      {getUpcomingMeetings()
                        .filter(meeting => meeting.businessId === selectedBusiness.id)
                        .map((meeting) => (
                        <Card key={meeting.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  meeting.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                                }`}></div>
                                <div>
                                  <p className="font-medium">{meeting.type === 'video' ? 'Video Call' : 'Phone Call'}</p>
                                  <p className="text-sm text-gray-600">
                                    {meeting.datetime.toLocaleDateString()} at {meeting.datetime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                </div>
                              </div>
                              <Badge className={meeting.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                {meeting.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{meeting.notes}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="flex-1 p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium">Shared Media</h4>
                        <Button size="sm">
                          <Paperclip className="w-4 h-4 mr-1" />
                          Upload
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="cursor-pointer hover:shadow-md">
                          <CardContent className="p-4 text-center">
                            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm font-medium">Website Proposal.pdf</p>
                            <p className="text-xs text-gray-500">2 days ago</p>
                          </CardContent>
                        </Card>
                        <Card className="cursor-pointer hover:shadow-md">
                          <CardContent className="p-4 text-center">
                            <Image className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm font-medium">Logo Options.png</p>
                            <p className="text-xs text-gray-500">1 day ago</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="flex-1 p-4">
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium">Client Notes</h4>
                      <Textarea
                        placeholder="Add notes about this client..."
                        className="min-h-32"
                        defaultValue={selectedBusiness.notes || ""}
                      />
                      <Button>Save Notes</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a business from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}