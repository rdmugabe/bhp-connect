"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { messageSchema, type MessageInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Send } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  facility: {
    id: string;
    name: string;
  };
}

export default function FacilityMessagesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [facilityId, setFacilityId] = useState<string>("");
  const [facilityName, setFacilityName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // First get facility info
        const facilitiesResponse = await fetch("/api/facilities");
        if (facilitiesResponse.ok) {
          const facilitiesData = await facilitiesResponse.json();
          if (facilitiesData.facilities?.length > 0) {
            const facility = facilitiesData.facilities[0];
            setFacilityId(facility.id);
            setFacilityName(facility.name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch facility:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      if (!facilityId) return;
      try {
        const response = await fetch(`/api/messages?facilityId=${facilityId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);

          // Mark messages as read
          const unreadMessageIds = (data.messages || [])
            .filter((m: Message & { readAt?: string | null }) =>
              m.sender.id !== session?.user?.id && !m.readAt
            )
            .map((m: Message) => m.id);

          if (unreadMessageIds.length > 0) {
            fetch("/api/messages/read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageIds: unreadMessageIds }),
            }).catch(console.error);
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    }
    fetchMessages();
  }, [facilityId, session?.user?.id]);

  async function onSubmit(data: MessageInput) {
    if (!facilityId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Facility not found",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          facilityId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const result = await response.json();
      setMessages((prev) => [result.message, ...prev]);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with your BHP consultant
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{facilityName || "Messages"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Input */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        placeholder="Type your message..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Form>

          {/* Message List */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender.id === session?.user?.id
                    ? "flex-row-reverse"
                    : ""
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {message.sender.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex-1 max-w-[70%] ${
                    message.sender.id === session?.user?.id ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender.id === session?.user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.sender.name} - {formatDateTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation with your BHP!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
