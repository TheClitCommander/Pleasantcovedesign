import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, TrendingUp, Calendar, Users, Clock, UserX, 
  CheckCircle2, PieChart, BarChart3, Activity, Loader2 
} from "lucide-react";
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export default function Analytics() {
  // Fetch scheduling analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/scheduling/analytics"],
    queryFn: api.getSchedulingAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Prepare data for charts
  const bookingTypeData = [
    { name: "Auto-Scheduled", value: analytics?.autoScheduledCount || 0, color: "#6b7280" },
    { name: "Manual", value: analytics?.manualCount || 0, color: "#3b82f6" },
  ];

  const appointmentStatusData = [
    { name: "Confirmed", value: analytics?.appointmentBreakdown?.confirmed || 0, color: "#3b82f6" },
    { name: "Completed", value: analytics?.appointmentBreakdown?.completed || 0, color: "#10b981" },
    { name: "No-Show", value: analytics?.appointmentBreakdown?.noShow || 0, color: "#ef4444" },
  ];

  const slotPerformanceData = analytics?.popularSlots?.map(slot => ({
    time: slot.time,
    scheduled: slot.scheduled,
    showed: slot.showed,
    noShow: slot.noShow || 0,
  })) || [];

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
              <a href="/inbox" className="text-gray-600 hover:text-gray-900">Inbox</a>
              <a href="/scheduling" className="text-gray-600 hover:text-gray-900">Scheduling</a>
              <a href="/clients" className="text-gray-600 hover:text-gray-900">Clients</a>
              <a href="/templates" className="text-gray-600 hover:text-gray-900">Templates</a>
              <a href="/analytics" className="text-primary border-b-2 border-primary pb-2 font-medium">Analytics</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scheduling Analytics</h1>
            <p className="text-gray-600 mt-1">Track your appointment booking trends and performance</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalBookings || 0}</div>
                <p className="text-xs text-muted-foreground">All-time appointments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Show Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.showRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Attendance rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics?.noShowRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Missed appointments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Time to Book</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.avgTimeToBooking || 0}h</div>
                <p className="text-xs text-muted-foreground">From contact to booking</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="booking-types" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="booking-types">Booking Types</TabsTrigger>
              <TabsTrigger value="appointment-status">Appointment Status</TabsTrigger>
              <TabsTrigger value="time-slots">Time Slot Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="booking-types" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manual vs Auto-Scheduled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={bookingTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {bookingTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <div className="w-3 h-3 bg-gray-500 rounded-full mr-2" />
                        Auto-Scheduled (via booking link)
                      </span>
                      <span className="font-medium">{analytics?.autoScheduledCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                        Manual (dragged on calendar)
                      </span>
                      <span className="font-medium">{analytics?.manualCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointment-status" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={appointmentStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {appointmentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 text-blue-500 mr-2" />
                        Confirmed
                      </span>
                      <span className="font-medium">{analytics?.appointmentBreakdown?.confirmed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                        Completed
                      </span>
                      <span className="font-medium">{analytics?.appointmentBreakdown?.completed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <UserX className="w-4 h-4 text-red-500 mr-2" />
                        No-Show
                      </span>
                      <span className="font-medium">{analytics?.appointmentBreakdown?.noShow || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="time-slots" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Time Slot Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={slotPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="scheduled" fill="#3b82f6" name="Scheduled" />
                        <Bar dataKey="showed" fill="#10b981" name="Showed" />
                        <Bar dataKey="noShow" fill="#ef4444" name="No-Show" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {analytics?.mostPopularTime && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Most Popular Time:</strong> {analytics.mostPopularTime}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Additional Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Quick Stats</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Average booking happens <strong>{analytics?.avgTimeToBooking || 0} hours</strong> after first contact</li>
                    <li>• <strong>{analytics?.showRate || 0}%</strong> of scheduled appointments are attended</li>
                    <li>• Most appointments are booked for <strong>{analytics?.mostPopularTime || "N/A"}</strong></li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-700 mb-2">Recommendations</h4>
                  <ul className="space-y-1 text-sm text-blue-600">
                    {analytics?.noShowRate && analytics.noShowRate > 20 && (
                      <li>• High no-show rate detected. Consider sending reminder messages.</li>
                    )}
                    {analytics?.autoScheduledCount && analytics?.manualCount && 
                     analytics.autoScheduledCount > analytics.manualCount && (
                      <li>• Self-service booking is popular! Keep promoting your scheduling link.</li>
                    )}
                    <li>• Focus outreach efforts {analytics?.avgTimeToBooking && analytics.avgTimeToBooking < 24 ? "early in the day" : "consistently throughout the week"}.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 