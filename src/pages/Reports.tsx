import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { FileText, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { mockReports } from "@/lib/mockData";
import { formatDistanceToNow } from "date-fns";

const Reports = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onKeyboardShortcut={() => {}}
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                My Reports
              </h1>
              <p className="text-muted-foreground">
                Track your submitted flags and their review status
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {mockReports.map((report) => (
              <Card key={report.id} className="transition-colors hover:bg-muted/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <Badge className={`risk-chip ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1 capitalize">{report.status}</span>
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {report.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Transaction */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{report.category}</p>
                        <code className="mono-hash text-xs bg-muted/50 px-2 py-1 rounded">
                          {report.txSig.slice(0, 16)}...
                        </code>
                      </div>

                      {/* Notes */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.notes}
                      </p>

                      {/* Evidence */}
                      {report.evidenceUrls.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Evidence:</span>
                          {report.evidenceUrls.map((url, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="h-5 px-2 text-xs"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Link {index + 1}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {report.confidence}% confidence
                      </div>
                      {report.points && (
                        <div className="text-lg font-bold text-primary">
                          +{report.points} pts
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {mockReports.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No reports yet</h3>
                  <p className="text-muted-foreground">
                    Start analyzing transactions to submit your first flag
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;