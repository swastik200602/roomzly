import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Save, Trash2, Upload } from "lucide-react";
import { Suspense, lazy, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { propertiesApi, type CreatePropertyPayload, type PropertyVerificationDocument } from "@/lib/api/properties";
import type { Property, PropertyImage } from "@/lib/properties";
import { useAuth } from "@/stores/auth";
import { PROPERTY_IMAGE_ACCEPT, PROPERTY_IMAGE_MAX_COUNT, validatePropertyImages } from "@/lib/image-files";
const LocationPicker = lazy(() => import("@/components/location/LeafletMap").then((module) => ({ default: module.LocationPicker })));

export const Route = createFileRoute("/dashboard/edit-property/$id")({
  head: () => ({ meta: [{ title: "Edit property - Roomzly Dashboard" }] }),
  component: EditPropertyPage,
});

const schema = z.object({
  title: z.string().min(3, "Give it a real name").max(180),
  description: z.string().min(20, "At least 20 characters").max(4000),
  city: z.string().min(2, "City required").max(120),
  locality: z.string().min(2, "Locality required").max(120),
  state: z.string().min(2, "State required").max(120),
  country: z.string().min(2, "Country required").max(120),
  neighborhood: z.string().max(120).optional(),
  address: z.string().min(4, "Address required").max(240),
  formattedAddress: z.string().min(8, "Choose a full address from the map").max(500),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  category: z.enum(["APARTMENT", "VILLA", "STUDIO", "LOFT", "PG", "COMMERCIAL"]),
  price: z.coerce.number().positive("Price required"),
  beds: z.coerce.number().int().nonnegative(),
  baths: z.coerce.number().nonnegative(),
  sqft: z.coerce.number().int().positive("Area required"),
  amenities: z.string().optional(),
  furnishing: z.enum(["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"]),
});

type FormValues = z.infer<typeof schema>;

function EditPropertyPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const canManageListings = user?.role === "OWNER" || user?.role === "ADMIN";
  const [verificationType, setVerificationType] = useState<PropertyVerificationDocument["type"]>("OWNERSHIP_DOCUMENT");
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const listingsQuery = useQuery({
    queryKey: ["owner-listings"],
    queryFn: propertiesApi.ownerListings,
    enabled: canManageListings,
  });
  const property = listingsQuery.data?.find((item) => item.id === id);
  const verificationQuery = useQuery({
    queryKey: ["property-verification-documents", id],
    queryFn: () => propertiesApi.verificationDocuments(id),
    enabled: canManageListings && Boolean(property),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      description: "",
      city: "",
      locality: "",
      state: "",
      country: "India",
      neighborhood: "",
      address: "",
      formattedAddress: "",
      latitude: 30.3256,
      longitude: 78.0437,
      category: "APARTMENT",
      price: 0,
      beds: 1,
      baths: 1,
      sqft: 1,
      amenities: "",
      furnishing: "FURNISHED",
    },
  });

  useEffect(() => {
    if (!property) return;
    form.reset(toFormValues(property));
  }, [form, property]);

  const updateMutation = useMutation({
    mutationFn: (payload: CreatePropertyPayload) => propertiesApi.update(id, payload),
    onSuccess: (updated) => {
      toast.success("Listing updated");
      queryClient.setQueryData<Property[]>(["owner-listings"], (previous) =>
        previous?.map((item) => (item.id === updated.id ? updated : item)) ?? previous,
      );
      queryClient.setQueryData(["property", updated.slug], updated);
      if (property?.slug && property.slug !== updated.slug) {
        queryClient.removeQueries({ queryKey: ["property", property.slug] });
      }
      queryClient.invalidateQueries({ queryKey: ["owner-listings"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property", updated.slug] });
      navigate({ to: "/dashboard/my-listings" });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not update listing");
    },
  });
  const verificationMutation = useMutation({
    mutationFn: () => {
      if (!verificationFile) throw new Error("Choose a document first");
      return propertiesApi.uploadVerificationDocument(id, { type: verificationType, file: verificationFile });
    },
    onSuccess: () => {
      setVerificationFile(null);
      toast.success("Property verification document submitted");
      queryClient.invalidateQueries({ queryKey: ["property-verification-documents", id] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError || error instanceof Error ? error.message : "Document upload failed");
    },
  });
  const photoMutation = useMutation({
    mutationFn: () => {
      if (photoFiles.length === 0) throw new Error("Choose at least one photo first");
      return propertiesApi.addImages(id, photoFiles);
    },
    onSuccess: (updated) => {
      setPhotoFiles([]);
      toast.success("Property photos uploaded");
      queryClient.setQueryData<Property[]>(["owner-listings"], (previous) =>
        previous?.map((item) => (item.id === updated.id ? updated : item)) ?? previous,
      );
      queryClient.invalidateQueries({ queryKey: ["owner-listings"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property", updated.slug] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError || error instanceof Error ? error.message : "Photo upload failed");
    },
  });
  const deletePhotoMutation = useMutation({
    mutationFn: (imageId: string) => propertiesApi.deleteImage(id, imageId),
    onSuccess: () => {
      toast.success("Photo removed");
      queryClient.invalidateQueries({ queryKey: ["owner-listings"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      if (property?.slug) queryClient.invalidateQueries({ queryKey: ["property", property.slug] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not remove photo");
    },
  });

  if (!canManageListings) {
    return (
      <div className="p-6 md:p-10 animate-fade-in max-w-4xl">
        <p className="text-mono-eyebrow mb-3">Owner access required</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tighter font-bold">Edit property</h1>
        <p className="text-sm text-muted-foreground mt-3">Only owners and admins can manage property listings.</p>
      </div>
    );
  }

  if (listingsQuery.isLoading) {
    return (
      <div className="p-6 md:p-10 animate-fade-in">
        <p className="text-mono-eyebrow">Loading property</p>
      </div>
    );
  }

  if (listingsQuery.isError) {
    return (
      <div className="p-6 md:p-10 animate-fade-in max-w-2xl">
        <p className="text-mono-eyebrow mb-3">Could not load property</p>
        <h1 className="font-display text-4xl tracking-tighter font-bold mb-6">Try loading this listing again.</h1>
        <button
          type="button"
          onClick={() => listingsQuery.refetch()}
          className="bg-foreground text-background px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6 md:p-10 animate-fade-in max-w-2xl">
        <p className="text-mono-eyebrow mb-3">Listing unavailable</p>
        <h1 className="font-display text-4xl tracking-tighter font-bold mb-6">This property is not in your active listings.</h1>
        <Link
          to="/dashboard/my-listings"
          className="bg-foreground text-background px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm inline-flex items-center gap-2"
        >
          <ArrowLeft className="size-4" /> My listings
        </Link>
      </div>
    );
  }

  const submit = (values: FormValues) => {
    updateMutation.mutate(toPayload(values));
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 animate-fade-in max-w-4xl">
      <div className="mb-8">
        <Link
          to="/dashboard/my-listings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-4" /> My listings
        </Link>
        <p className="text-mono-eyebrow mb-2">{property.code}</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tighter font-bold">Edit property</h1>
      </div>

      <form onSubmit={form.handleSubmit(submit)} className="border border-border bg-surface p-5 sm:p-6 md:p-8 space-y-8">
        <section className="space-y-5">
          <p className="text-mono-eyebrow">Basics</p>
          <Field form={form} name="title" label="Title" />
          <Field form={form} name="description" label="Description" textarea />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field form={form} name="category" label="Category" select={CATEGORY_OPTIONS} />
            <Field form={form} name="furnishing" label="Furnishing" select={FURNISHING_OPTIONS} />
          </div>
        </section>

        <section className="space-y-5">
          <p className="text-mono-eyebrow">Location</p>
          <Suspense
            fallback={
              <div className="min-h-[24rem] grid place-items-center rounded-sm border border-border bg-surface text-sm text-muted-foreground">
                Loading location picker
              </div>
            }
          >
            <LocationPicker
              value={form.watch()}
              onChange={(location) => {
                form.setValue("country", location.country, { shouldValidate: true, shouldDirty: true });
                form.setValue("state", location.state, { shouldValidate: true, shouldDirty: true });
                form.setValue("city", location.city, { shouldValidate: true, shouldDirty: true });
                form.setValue("locality", location.locality || location.city, { shouldValidate: true, shouldDirty: true });
                form.setValue("neighborhood", location.locality || location.city, { shouldValidate: true, shouldDirty: true });
                form.setValue("address", location.address, { shouldValidate: true, shouldDirty: true });
                form.setValue("formattedAddress", location.formattedAddress, { shouldValidate: true, shouldDirty: true });
                form.setValue("latitude", location.latitude, { shouldValidate: true, shouldDirty: true });
                form.setValue("longitude", location.longitude, { shouldValidate: true, shouldDirty: true });
              }}
            />
          </Suspense>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field form={form} name="country" label="Country" />
            <Field form={form} name="state" label="State" />
            <Field form={form} name="city" label="City" />
            <Field form={form} name="locality" label="Locality / Area" />
          </div>
          <Field form={form} name="neighborhood" label="Neighborhood" />
          <Field form={form} name="address" label="Full address" />
          <Field form={form} name="formattedAddress" label="Formatted address" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field form={form} name="latitude" label="Latitude" type="number" />
            <Field form={form} name="longitude" label="Longitude" type="number" />
          </div>
        </section>

        <section className="space-y-5">
          <p className="text-mono-eyebrow">Pricing and size</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field form={form} name="price" label="Monthly rent" type="number" />
            <Field form={form} name="beds" label="Bedrooms" type="number" />
            <Field form={form} name="baths" label="Bathrooms" type="number" />
            <Field form={form} name="sqft" label="Area sqft" type="number" />
          </div>
        </section>

        <section className="space-y-5">
          <p className="text-mono-eyebrow">Features</p>
          <Field form={form} name="amenities" label="Amenities" placeholder="Wifi, parking, gym, pool" />
        </section>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Link
            to="/dashboard/my-listings"
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm border border-border hover:bg-surface-hi"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-accent text-accent-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="size-3.5" />
            {updateMutation.isPending ? "Saving" : "Save changes"}
          </button>
        </div>
      </form>

      <PropertyPhotosPanel
        images={property.images ?? []}
        selectedFiles={photoFiles}
        setSelectedFiles={setPhotoFiles}
        existingCount={property.images?.length ?? 0}
        uploading={photoMutation.isPending}
        deletingId={typeof deletePhotoMutation.variables === "string" ? deletePhotoMutation.variables : null}
        onUpload={() => photoMutation.mutate()}
        onDelete={(imageId) => deletePhotoMutation.mutate(imageId)}
      />

      <PropertyVerificationPanel
        documents={verificationQuery.data ?? []}
        loading={verificationQuery.isLoading}
        type={verificationType}
        setType={setVerificationType}
        file={verificationFile}
        setFile={setVerificationFile}
        pending={verificationMutation.isPending}
        onSubmit={() => verificationMutation.mutate()}
      />
    </div>
  );
}

const CATEGORY_OPTIONS = [
  ["APARTMENT", "Apartment"],
  ["VILLA", "Villa"],
  ["STUDIO", "Studio"],
  ["LOFT", "Co-living"],
  ["PG", "PG / Hostel"],
  ["COMMERCIAL", "Commercial"],
] as const;

const FURNISHING_OPTIONS = [
  ["FURNISHED", "Furnished"],
  ["SEMI_FURNISHED", "Semi-furnished"],
  ["UNFURNISHED", "Unfurnished"],
] as const;

function Field({
  form,
  name,
  label,
  type = "text",
  textarea,
  select,
  placeholder,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  name: keyof FormValues;
  label: string;
  type?: string;
  textarea?: boolean;
  select?: readonly (readonly [string, string])[];
  placeholder?: string;
}) {
  const error = form.formState.errors[name];
  const cls =
    "w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-accent";
  return (
    <label className="block">
      <span className="text-mono-eyebrow block mb-2">{label}</span>
      {select ? (
        <select {...form.register(name)} className={cls}>
          {select.map(([value, optionLabel]) => (
            <option key={value} value={value}>
              {optionLabel}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea rows={5} placeholder={placeholder} {...form.register(name)} className={cls} />
      ) : (
        <input type={type} step={type === "number" ? "any" : undefined} placeholder={placeholder} {...form.register(name)} className={cls} />
      )}
      {error && <span className="text-xs text-destructive mt-1.5 block">{String(error.message)}</span>}
    </label>
  );
}

function toFormValues(property: Property): FormValues {
  return {
    title: property.title,
    description: property.description,
    city: property.city,
    locality: property.locality ?? property.neighborhood ?? property.city,
    state: property.state ?? "",
    country: property.country ?? "India",
    neighborhood: property.neighborhood ?? "",
    address: property.address ?? "",
    formattedAddress: property.formattedAddress ?? property.address ?? "",
    latitude: property.latitude ?? 30.3256,
    longitude: property.longitude ?? 78.0437,
    category: property.category.toUpperCase() as FormValues["category"],
    price: property.price,
    beds: property.beds,
    baths: property.baths,
    sqft: property.sqft,
    amenities: property.amenities.join(", "),
    furnishing: furnishingToApi(property.furnishing),
  };
}

function toPayload(values: FormValues): CreatePropertyPayload {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    city: values.city.trim(),
    locality: values.locality.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    neighborhood: values.neighborhood?.trim() || undefined,
    address: values.address.trim(),
    formattedAddress: values.formattedAddress.trim(),
    latitude: values.latitude,
    longitude: values.longitude,
    category: values.category,
    price: values.price,
    beds: values.beds,
    baths: values.baths,
    sqft: values.sqft,
    amenities: (values.amenities ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    furnishing: values.furnishing,
  };
}

function furnishingToApi(furnishing: Property["furnishing"]): FormValues["furnishing"] {
  if (furnishing === "Semi-furnished") return "SEMI_FURNISHED";
  if (furnishing === "Unfurnished") return "UNFURNISHED";
  return "FURNISHED";
}

function PropertyPhotosPanel({
  images,
  selectedFiles,
  setSelectedFiles,
  existingCount,
  uploading,
  deletingId,
  onUpload,
  onDelete,
}: {
  images: PropertyImage[];
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  existingCount: number;
  uploading: boolean;
  deletingId: string | null;
  onUpload: () => void;
  onDelete: (imageId: string) => void;
}) {
  const remainingSlots = Math.max(0, PROPERTY_IMAGE_MAX_COUNT - existingCount);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const { accepted, rejectedType, rejectedSize } = validatePropertyImages(fileList);

    if (rejectedType > 0) toast.error("Only JPG, PNG, and WEBP property photos are supported.");
    if (rejectedSize > 0) toast.error("Each property photo must be 10MB or smaller.");

    setSelectedFiles((previous) => {
      const next = [...previous, ...accepted].slice(0, remainingSlots);
      if (previous.length + accepted.length > remainingSlots) toast.error("This property can have up to 10 photos.");
      return next;
    });
  };

  return (
    <section className="mt-8 border border-border bg-surface p-5 sm:p-6 md:p-8 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-mono-eyebrow mb-2">Photos</p>
          <h2 className="font-display text-2xl tracking-tight">Property gallery</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload JPG, PNG, or WEBP photos. Max 10MB each.</p>
        </div>
        <span className="border border-border bg-background px-2 py-1 rounded-sm text-[10px] font-mono uppercase tracking-widest">
          {existingCount}/{PROPERTY_IMAGE_MAX_COUNT}
        </span>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative aspect-square border border-border bg-background overflow-hidden group">
              <img src={image.url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onDelete(image.id)}
                disabled={deletingId === image.id}
                className="absolute inset-x-2 bottom-2 bg-background/95 text-foreground px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm inline-flex items-center justify-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <Trash2 className="size-3" />
                {deletingId === image.id ? "Removing" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
          This listing has no property photos yet.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <label className={`block ${remainingSlots === 0 ? "opacity-50" : ""}`}>
          <span className="text-mono-eyebrow block mb-2">Add photos</span>
          <span className="flex items-center justify-between gap-3 bg-background border border-border rounded-sm px-3 py-2.5 text-sm cursor-pointer hover:border-accent">
            <span className="truncate">
              {selectedFiles.length > 0 ? `${selectedFiles.length} selected` : remainingSlots === 0 ? "Photo limit reached" : "Choose property photos"}
            </span>
            <Upload className="size-4 text-muted-foreground" />
            <input
              type="file"
              accept={PROPERTY_IMAGE_ACCEPT}
              multiple
              disabled={remainingSlots === 0}
              className="sr-only"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </span>
        </label>
        <button
          type="button"
          disabled={selectedFiles.length === 0 || uploading}
          onClick={onUpload}
          className="bg-foreground text-background px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Upload className="size-3.5" />
          {uploading ? "Uploading" : "Upload photos"}
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <button
              key={`${file.name}-${file.lastModified}-${index}`}
              type="button"
              onClick={() => setSelectedFiles((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
              className="border border-border bg-background px-2.5 py-1.5 text-xs rounded-sm hover:border-destructive hover:text-destructive"
            >
              {file.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function PropertyVerificationPanel({
  documents,
  loading,
  type,
  setType,
  file,
  setFile,
  pending,
  onSubmit,
}: {
  documents: PropertyVerificationDocument[];
  loading: boolean;
  type: PropertyVerificationDocument["type"];
  setType: (type: PropertyVerificationDocument["type"]) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  pending: boolean;
  onSubmit: () => void;
}) {
  return (
    <section className="mt-8 border border-border bg-surface p-5 sm:p-6 md:p-8 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-mono-eyebrow mb-2">Trust verification</p>
          <h2 className="font-display text-2xl tracking-tight">Property documents</h2>
          <p className="text-sm text-muted-foreground mt-1">Submit ownership proof, utility bill, or property proof for admin verification.</p>
        </div>
        {documents[0] && <StatusBadge status={documents[0].status} />}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
        <label className="block">
          <span className="text-mono-eyebrow block mb-2">Document type</span>
          <select value={type} onChange={(event) => setType(event.target.value as PropertyVerificationDocument["type"])} className="w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-accent">
            <option value="OWNERSHIP_DOCUMENT">Ownership document</option>
            <option value="UTILITY_BILL">Utility bill</option>
            <option value="PROPERTY_PROOF">Property proof</option>
          </select>
        </label>
        <label className="block">
          <span className="text-mono-eyebrow block mb-2">File</span>
          <span className="flex items-center justify-between gap-3 bg-background border border-border rounded-sm px-3 py-2.5 text-sm cursor-pointer hover:border-accent">
            <span className="truncate">{file ? file.name : "Choose image document"}</span>
            <Upload className="size-4 text-muted-foreground" />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                if (next && next.size > 8 * 1024 * 1024) {
                  toast.error("Document must be 8MB or smaller");
                  return;
                }
                setFile(next);
              }}
            />
          </span>
        </label>
        <button
          type="button"
          disabled={!file || pending}
          onClick={onSubmit}
          className="bg-foreground text-background px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Upload className="size-3.5" />
          {pending ? "Submitting" : "Submit"}
        </button>
      </div>

      <div className="border border-border divide-y divide-border">
        {loading && <p className="p-4 text-sm text-muted-foreground">Loading property verification documents</p>}
        {!loading && documents.length === 0 && <p className="p-4 text-sm text-muted-foreground">No property documents submitted yet.</p>}
        {documents.map((document) => (
          <div key={document.id} className="p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium inline-flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                {document.type.toLowerCase().replaceAll("_", " ")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Submitted {new Date(document.createdAt).toLocaleDateString()}
                {document.reviewedAt ? ` - Reviewed ${new Date(document.reviewedAt).toLocaleDateString()}` : ""}
              </p>
              {document.rejectionReason && <p className="text-xs text-destructive mt-1">{document.rejectionReason}</p>}
            </div>
            <StatusBadge status={document.status} />
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: PropertyVerificationDocument["status"] }) {
  const label = status.toLowerCase().replaceAll("_", " ");
  const cls =
    status === "VERIFIED"
      ? "border-accent/30 text-accent bg-accent/10"
      : status === "REJECTED" || status === "RESUBMISSION_REQUESTED"
        ? "border-destructive/30 text-destructive bg-destructive/10"
        : "border-border text-muted-foreground bg-background";
  return <span className={`inline-flex px-2 py-1 border rounded-sm font-mono text-[10px] uppercase tracking-widest ${cls}`}>{label}</span>;
}
