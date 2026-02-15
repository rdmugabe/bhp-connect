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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Facility {
  id: string;
  name: string;
}

export default function BHPMessagesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const response = await fetch("/api/facilities");
        if (response.ok) {
          const data = await response.json();
          setFacilities(data.facilities || []);
          if (data.facilities?.length > 0) {
            setSelectedFacility(data.facilities[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch facilities:", error);
      }
    }
    fetchFacilities();
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      if (!selectedFacility) return;
      try {
        const response = await fetch(
          `/api/messages?facilityId=${selectedFacility}`
        );
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
  }, [selectedFacility, session?.user?.id]);

  async function onSubmit(data: MessageInput) {
    if (!selectedFacility) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a facility",
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
          facilityId: selectedFacility,
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
          Communicate with your facility operators
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Facility Selector */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Facility</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger>
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {facilities.find((f) => f.id === selectedFacility)?.name ||
                "Messages"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Message Input */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex gap-2"
              >
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
                      message.sender.id === session?.user?.id
                        ? "text-right"
                        : ""
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
                      {message.sender.name} -{" "}
                      {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
