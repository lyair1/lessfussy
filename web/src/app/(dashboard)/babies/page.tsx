"use client";

import { useState } from "react";
import { Plus, Share2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AddBabyDialog } from "@/components/babies/add-baby-dialog";
import { ShareBabyDialog } from "@/components/babies/share-baby-dialog";
import { EditBabyDialog } from "@/components/babies/edit-baby-dialog";
import { DeleteBabyDialog } from "@/components/babies/delete-baby-dialog";
import { useBaby } from "@/components/layout/dashboard-shell";

export default function BabiesPage() {
  const { babies } = useBaby();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);

  const selectedBaby = babies.find((b) => b.id === selectedBabyId);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Babies</h1>
          <p className="text-muted-foreground">
            Manage your babies and sharing settings
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="gap-2 bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Baby</span>
        </Button>
      </div>

      {babies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No babies added yet</p>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="gap-2 bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Add Your First Baby
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {babies.map((baby) => (
            <Card key={baby.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={baby.photoUrl || undefined} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                        {baby.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{baby.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(baby.birthDate)}
                      </p>
                    </div>
                  </div>
                  {baby.isShared && (
                    <Badge variant="secondary" className="text-xs">
                      Shared
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  {baby.role === "owner" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => {
                          setSelectedBabyId(baby.id);
                          setShareDialogOpen(true);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setSelectedBabyId(baby.id);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedBabyId(baby.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {baby.role !== "owner" && (
                    <Badge variant="outline" className="text-xs">
                      {baby.role === "editor" ? "Can edit" : "View only"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddBabyDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      {selectedBaby && (
        <>
          <ShareBabyDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            baby={selectedBaby}
          />
          <EditBabyDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            baby={selectedBaby}
          />
          <DeleteBabyDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            baby={selectedBaby}
          />
        </>
      )}
    </div>
  );
}

