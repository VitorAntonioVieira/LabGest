"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "@/components/modals/create-task-dialog";

interface KanbanHeaderActionsProps {
  workspaceId: string;
  columns: { id: string; title: string }[];
}

export function KanbanHeaderActions({ workspaceId, columns }: KanbanHeaderActionsProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="text-xs">
        <Link href={`/workspace/${workspaceId}/docs`}>
          <BookOpen className="mr-1.5 h-3.5 w-3.5 text-secondary" />
          Abrir Caderno Docs
        </Link>
      </Button>

      <Button
        size="sm"
        onClick={() => setIsCreateTaskOpen(true)}
        className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 shadow-xs cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Nova Atividade</span>
      </Button>

      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        workspaceId={workspaceId}
        columns={columns}
      />
    </div>
  );
}
