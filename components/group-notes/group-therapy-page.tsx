"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupNotesWizard } from "./group-notes-wizard";
import { GroupTherapyMaterialTab } from "./group-therapy-material-tab";

export function GroupTherapyPage() {
  const [tab, setTab] = useState("notes");

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Group Therapy</h1>
        <p className="text-sm text-muted-foreground">
          Generate today&apos;s session material, and capture per-resident notes at the end of group.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full sm:w-auto">
          <TabsTrigger value="material">Session Material</TabsTrigger>
          <TabsTrigger value="notes">Session Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="material" className="mt-0">
          <GroupTherapyMaterialTab />
        </TabsContent>

        <TabsContent value="notes" className="mt-0">
          <GroupNotesWizard embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
