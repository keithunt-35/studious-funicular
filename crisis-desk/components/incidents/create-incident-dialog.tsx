"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { INCIDENT_CATEGORIES, SEVERITY_CONFIG } from "@/constants";
import { createIncident, getEvent, updateIncident, uploadIncidentPhoto } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const createIncidentSchema = z.object({
  title: z.string().trim().min(3, "Add a short incident title."),
  description: z.string().trim().min(10, "Add enough detail for the response team."),
  severity: z.enum(["critical", "high", "medium", "low"]),
  category: z.string().min(1, "Choose a category."),
  location: z.string().trim().max(120, "Location is too long.").optional(),
  photo: z.custom<FileList | undefined>((value) => value === undefined || (typeof FileList !== "undefined" && value instanceof FileList)).optional(),
});

type CreateIncidentFormValues = z.infer<typeof createIncidentSchema>;

const defaultEventId = process.env.NEXT_PUBLIC_DEFAULT_EVENT_ID ?? "default-event";

export function CreateIncidentDialog() {
  const { userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([...INCIDENT_CATEGORIES]);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateIncidentFormValues>({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "medium",
      category: "",
      location: "",
    },
  });

  const selectedSeverity = useWatch({ control, name: "severity" });
  const selectedCategory = useWatch({ control, name: "category" });
  const selectedPhoto = useWatch({ control, name: "photo" });

  useEffect(() => {
    getEvent(defaultEventId).then((event) => {
      if (event?.categories?.length) setCategoryOptions(event.categories);
    }).catch(() => undefined);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
      setSubmitError(null);
    }
  };

  const onSubmit = async (values: CreateIncidentFormValues) => {
    if (!userProfile) return;
    setSubmitError(null);

    try {
      const incidentId = await createIncident({
        title: values.title,
        description: values.description,
        severity: values.severity,
        category: values.category,
        location: values.location || null,
        eventId: defaultEventId,
        reportedBy: userProfile.uid,
      });

      if (values.photo?.length) {
        const photoUrl = await uploadIncidentPhoto(incidentId, values.photo[0]);
        await updateIncident(incidentId, { photoUrl });
      }

      toast.success("Incident reported", { description: "Your response team can see it now." });
      handleOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "We couldn’t report this incident. Please try again.";
      setSubmitError(message);
    }
  };

  return (
    <>
      <Button className="gap-2 bg-red-700 text-white hover:bg-red-800" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New incident
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report an incident</DialogTitle>
            <DialogDescription>Capture the essentials so the right person can respond quickly.</DialogDescription>
          </DialogHeader>

          <form id="create-incident-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {submitError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{submitError}</div>}

            <div className="space-y-1.5">
              <Label htmlFor="incident-title">What happened?</Label>
              <Input id="incident-title" placeholder="e.g. Wireless microphone stopped working" className={cn("h-10", errors.title && "border-red-400")} disabled={isSubmitting} {...register("title")} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={selectedSeverity} onValueChange={(value) => setValue("severity", (value ?? "medium") as CreateIncidentFormValues["severity"], { shouldValidate: true })} disabled={isSubmitting}>
                  <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Choose severity" /></SelectTrigger>
                  <SelectContent>{Object.entries(SEVERITY_CONFIG).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}</SelectContent>
                </Select>
                {errors.severity && <p className="text-xs text-red-600">{errors.severity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={(value) => setValue("category", value ?? "", { shouldValidate: true })} disabled={isSubmitting}>
                  <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Choose category" /></SelectTrigger>
                  <SelectContent>{categoryOptions.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-600">{errors.category.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="incident-description">Description</Label>
              <textarea id="incident-description" rows={4} placeholder="Share what the response team needs to know..." disabled={isSubmitting} className={cn("flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30", errors.description && "border-red-400")} {...register("description")} />
              {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="incident-location">Location <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="incident-location" placeholder="e.g. Main stage" className="h-10" disabled={isSubmitting} {...register("location")} />{errors.location && <p className="text-xs text-red-600">{errors.location.message}</p>}</div>
              <div className="space-y-1.5"><Label htmlFor="incident-photo">Photo <span className="font-normal text-muted-foreground">(optional)</span></Label><label htmlFor="incident-photo" className={cn("flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/40", isSubmitting && "pointer-events-none opacity-60")}><ImagePlus className="size-4" /><span className="truncate">{selectedPhoto?.[0]?.name ?? "Attach a photo"}</span></label><input id="incident-photo" type="file" accept="image/*" className="sr-only" disabled={isSubmitting} {...register("photo")} />{selectedPhoto?.length ? <button type="button" className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setValue("photo", undefined)}><X className="size-3" />Remove photo</button> : null}</div>
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" form="create-incident-form" className="bg-red-700 text-white hover:bg-red-800" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="size-4 animate-spin" />Reporting...</> : "Report incident"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}