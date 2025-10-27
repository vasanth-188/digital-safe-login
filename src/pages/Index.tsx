import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 p-4">
      <Card className="w-full max-w-2xl backdrop-blur-sm bg-background/95 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Welcome!</CardTitle>
          <CardDescription className="text-center text-lg">
            You're successfully logged in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Email:</p>
            <p className="font-semibold text-lg">{user?.email}</p>
          </div>
          
          <Button 
            onClick={signOut} 
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
