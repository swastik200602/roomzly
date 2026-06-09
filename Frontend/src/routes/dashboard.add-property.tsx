import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { propertiesApi, type CreatePropertyPayload } from "@/lib/api/properties";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/stores/auth";
import { PROPERTY_IMAGE_ACCEPT, PROPERTY_IMAGE_MAX_COUNT, validatePropertyImages } from "@/lib/image-files";
const LocationPicker = lazy(() => import("@/components/location/LeafletMap").then((module) => ({ default: module.LocationPicker })));

export const Route = createFileRoute("/dashboard/add-property")({
  head: () => ({ meta: [{ title: "Add property — Roomzly Dashboard" }] }),
  component: AddPropertyWizard,
});

const schema = z.object({
  title: z.string().min(3, "Give it a real name"),
  category: z.string().min(1, "Pick a category"),
  country: z.string().min(2, "Country required"),
  state: z.string().min(2, "State required"),
  city: z.string().min(2, "City required"),
  locality: z.string().min(2, "Locality required"),
  address: z.string().min(4, "Address required"),
  formattedAddress: z.string().min(8, "Choose a full address from the map"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  price: z.coerce.number().min(1, "Price required"),
  beds: z.coerce.number().min(0),
  baths: z.coerce.number().min(0),
  sqft: z.coerce.number().min(1),
  description: z.string().min(20, "At least 20 characters"),
  amenities: z.string().optional(),
  furnishing: z.enum(["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"]).default("FURNISHED"),
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { id: "basic", label: "Basics" },
  { id: "pricing", label: "Pricing" },
  { id: "location", label: "Location" },
  { id: "amenities", label: "Amenities" },
  { id: "media", label: "Media" },
  { id: "review", label: "Review" },
] as const;

function AddPropertyWizard() {
  const navigate = useNavigate();
  const user = useAuth((state) => state.user);
  const canManageListings = user?.role === "OWNER" || user?.role === "ADMIN";
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const createMutation = useMutation({
    mutationFn: async (payload: { values: FormValues; files: File[] }) => {
      const property = await propertiesApi.create(toPayload(payload.values));
      if (payload.files.length > 0) {
        try {
          return await propertiesApi.addImages(property.id, payload.files);
        } catch (error) {
          await propertiesApi.remove(property.id).catch(() => undefined);
          throw error;
        }
      }
      return property;
    },
    onSuccess: () => {
      toast.success("Listing published");
      navigate({ to: "/dashboard/my-listings" });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not publish listing");
    },
  });

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      category: "",
      country: "India",
      state: "",
      city: "",
      locality: "",
      address: "",
      formattedAddress: "",
      latitude: 30.3256,
      longitude: 78.0437,
      price: 0,
      beds: 1,
      baths: 1,
      sqft: 0,
      description: "",
      amenities: "",
      furnishing: "FURNISHED",
    },
  });

  if (!canManageListings) {
    return (
      <div className="p-6 md:p-10 animate-fade-in max-w-4xl">
        <p className="text-mono-eyebrow mb-3">Owner access required</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tighter font-bold">Add a property</h1>
        <p className="text-sm text-muted-foreground mt-3">Only owners and admins can publish listings.</p>
      </div>
    );
  }

  if (!user?.phoneVerified && user?.role !== "ADMIN") {
    return (
      <div className="p-6 md:p-10 animate-fade-in max-w-4xl">
        <p className="text-mono-eyebrow mb-3">Mobile verification required</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tighter font-bold">Verify before listing.</h1>
        <p className="text-sm text-muted-foreground mt-3">
          Roomzly requires a verified mobile number before owners can publish properties.
        </p>
        <Link
          to="/dashboard/settings"
          className="inline-flex mt-5 bg-foreground text-background px-4 py-2.5 rounded-sm font-mono text-[10px] uppercase tracking-widest"
        >
          Verify mobile
        </Link>
      </div>
    );
  }

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({ values: data, files });
  };

  const onSubmitError = (errors: typeof methods.formState.errors) => {
    const firstErrorName = Object.keys(errors)[0] as keyof FormValues | undefined;
    if (firstErrorName) {
      const stepByField: Partial<Record<keyof FormValues, number>> = {
        title: 0,
        category: 0,
        description: 0,
        price: 1,
        beds: 1,
        baths: 1,
        sqft: 1,
        city: 2,
        locality: 2,
        state: 2,
        country: 2,
        address: 2,
        formattedAddress: 2,
        latitude: 2,
        longitude: 2,
        amenities: 3,
        furnishing: 3,
      };
      setStep(stepByField[firstErrorName] ?? 0);
    }
    toast.error("Please fix the highlighted fields before publishing");
  };

  const next = async () => {
    const fieldsByStep: (keyof FormValues)[][] = [
      ["title", "category", "description"],
      ["price", "beds", "baths", "sqft"],
      ["country", "state", "city", "locality", "address", "formattedAddress", "latitude", "longitude"],
      ["amenities", "furnishing"],
      [],
      [],
    ];
    const valid = await methods.trigger(fieldsByStep[step]);
    if (!valid) return;
    if (step === STEPS.length - 1) {
      methods.handleSubmit(onSubmit, onSubmitError)();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="p-6 md:p-10 animate-fade-in max-w-4xl">
      <div className="mb-10">
        <p className="text-mono-eyebrow mb-3">Step {step + 1} of {STEPS.length}</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tighter font-bold">
          Add a property
        </h1>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-4 h-1" />
      </div>

      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-px mb-10 bg-border border border-border">
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              "bg-background flex-1 min-w-[110px] px-4 py-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2",
              i === step && "text-foreground",
              i < step && "text-muted-foreground",
              i > step && "text-muted-foreground/60",
            )}
          >
            <span
              className={cn(
                "size-5 grid place-items-center border border-border rounded-full text-[10px]",
                i === step && "border-accent text-accent",
                i < step && "bg-accent border-accent text-accent-foreground",
              )}
            >
              {i < step ? <Check className="size-3" /> : i + 1}
            </span>
            {s.label}
          </li>
        ))}
      </ol>

      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()} className="border border-border bg-surface p-6 md:p-10">
          <div key={step}>
            {step === 0 && <BasicStep />}
            {step === 1 && <PricingStep />}
            {step === 2 && <LocationStep />}
            {step === 3 && <AmenitiesStep />}
            {step === 4 && <MediaStep files={files} setFiles={setFiles} />}
            {step === 5 && <ReviewStep values={methods.getValues()} />}
          </div>

          <div className="flex justify-between items-center mt-10 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={createMutation.isPending}
              className="bg-accent text-accent-foreground px-5 py-3 text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-accent/90 transition-colors inline-flex items-center gap-2"
            >
              {createMutation.isPending ? "Publishing..." : step === STEPS.length - 1 ? "Publish" : "Continue"}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

function toPayload(values: FormValues): CreatePropertyPayload {
  const categoryMap: Record<string, CreatePropertyPayload["category"]> = {
    apartment: "APARTMENT",
    apartments: "APARTMENT",
    villa: "VILLA",
    villas: "VILLA",
    studio: "STUDIO",
    loft: "LOFT",
    "co-living": "LOFT",
    pg: "PG",
    hostel: "PG",
    commercial: "COMMERCIAL",
  };
  const categoryKey = values.category.trim().toLowerCase();
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    city: values.city.trim(),
    country: values.country.trim(),
    state: values.state.trim(),
    locality: values.locality.trim(),
    neighborhood: values.locality.trim(),
    address: values.address.trim(),
    formattedAddress: values.formattedAddress.trim(),
    latitude: values.latitude,
    longitude: values.longitude,
    category: categoryMap[categoryKey] ?? "APARTMENT",
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

function Field({
  name,
  label,
  type = "text",
  textarea,
  placeholder,
}: {
  name: keyof FormValues;
  label: string;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
}) {
  const { register, formState } = useFormContext<FormValues>();
  const error = formState.errors[name];
  const cls =
    "w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-accent";
  return (
    <label className="block">
      <span className="text-mono-eyebrow block mb-2">{label}</span>
      {textarea ? (
        <textarea rows={5} placeholder={placeholder} {...register(name)} className={cls} />
      ) : (
        <input type={type} step={type === "number" ? "any" : undefined} placeholder={placeholder} {...register(name)} className={cls} />
      )}
      {error && (
        <span className="text-xs text-destructive mt-1.5 block">{String(error.message)}</span>
      )}
    </label>
  );
}

function BasicStep() {
  return (
    <div className="space-y-5">
      <Field name="title" label="Title" placeholder="The Obsidian Loft" />
      <Field name="category" label="Category" placeholder="Apartment, Villa, Studio…" />
      <Field name="description" label="Description" textarea placeholder="What makes this place special?" />
    </div>
  );
}

function PricingStep() {
  return (
    <div className="grid grid-cols-2 gap-5">
      <Field name="price" label="Monthly rent" type="number" />
      <Field name="sqft" label="Area (sqft)" type="number" />
      <Field name="beds" label="Bedrooms" type="number" />
      <Field name="baths" label="Bathrooms" type="number" />
    </div>
  );
}

function LocationStep() {
  const form = useFormContext<FormValues>();
  const values = form.watch();
  return (
    <div className="space-y-5">
      <Suspense
        fallback={
          <div className="min-h-[24rem] grid place-items-center rounded-sm border border-border bg-surface text-sm text-muted-foreground">
            Loading location picker
          </div>
        }
      >
        <LocationPicker
          value={values}
          onChange={(location) => {
            form.setValue("country", location.country, { shouldValidate: true, shouldDirty: true });
            form.setValue("state", location.state, { shouldValidate: true, shouldDirty: true });
            form.setValue("city", location.city, { shouldValidate: true, shouldDirty: true });
            form.setValue("locality", location.locality || location.city, { shouldValidate: true, shouldDirty: true });
            form.setValue("address", location.address, { shouldValidate: true, shouldDirty: true });
            form.setValue("formattedAddress", location.formattedAddress, { shouldValidate: true, shouldDirty: true });
            form.setValue("latitude", location.latitude, { shouldValidate: true, shouldDirty: true });
            form.setValue("longitude", location.longitude, { shouldValidate: true, shouldDirty: true });
          }}
        />
      </Suspense>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="country" label="Country" />
        <Field name="state" label="State" />
        <Field name="city" label="City" />
        <Field name="locality" label="Locality / Area" />
      </div>
      <Field name="address" label="Full address" placeholder="Street, building" />
      <Field name="formattedAddress" label="Formatted address" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="latitude" label="Latitude" type="number" />
        <Field name="longitude" label="Longitude" type="number" />
      </div>
    </div>
  );
}

function AmenitiesStep() {
  return (
    <div className="space-y-5">
      <Field
        name="amenities"
        label="Amenities (comma separated)"
        placeholder="Pool, Gym, Wifi, Parking"
      />
      <label className="block">
        <span className="text-mono-eyebrow block mb-2">Furnishing</span>
        <select
          {...useFormContext<FormValues>().register("furnishing")}
          className="w-full bg-background border border-border px-3 py-2.5 text-sm rounded-sm focus:outline-none focus:border-accent"
        >
          <option value="FURNISHED">Furnished</option>
          <option value="SEMI_FURNISHED">Semi-furnished</option>
          <option value="UNFURNISHED">Unfurnished</option>
        </select>
      </label>
    </div>
  );
}

function MediaStep({
  files,
  setFiles,
}: {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<Array<{ file: File; url: string }>>([]);

  useEffect(() => {
    const nextPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(nextPreviews);
    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [files]);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const { accepted, rejectedType, rejectedSize } = validatePropertyImages(incoming);

    if (rejectedType > 0) toast.error("Only JPG, PNG, and WEBP property photos are supported.");
    if (rejectedSize > 0) toast.error("Each property photo must be 10MB or smaller.");

    setFiles((prev) => {
      const next = [...prev, ...accepted].slice(0, PROPERTY_IMAGE_MAX_COUNT);
      if (prev.length + accepted.length > PROPERTY_IMAGE_MAX_COUNT) toast.error("You can upload up to 10 photos per property.");
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-mono-eyebrow mb-2">Photos</p>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={cn(
          "border-2 border-dashed p-10 text-center bg-background cursor-pointer block transition-colors",
          dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50",
        )}
      >
        <input
          type="file"
          accept={PROPERTY_IMAGE_ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm text-muted-foreground mb-1">Drag images here, or <span className="text-accent">browse</span></p>
        <p className="text-xs font-mono text-muted-foreground">JPG, PNG, or WEBP. Max 10MB each. Up to 10 images.</p>
      </label>
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {previews.map(({ file, url }, i) => (
            <div key={`${file.name}-${file.lastModified}-${i}`} className="relative aspect-square border border-border overflow-hidden group">
              <img src={url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white text-xs font-mono"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewStep({ values }: { values: FormValues }) {
  return (
    <div>
      <p className="text-mono-eyebrow mb-4">Review and publish</p>
      <h3 className="font-display text-2xl mb-6">{values.title || "Untitled listing"}</h3>
      <dl className="grid grid-cols-2 gap-px bg-border border border-border">
        {Object.entries(values).map(([k, v]) => (
          <div key={k} className="bg-background p-4">
            <dt className="text-mono-eyebrow mb-1">{k}</dt>
            <dd className="text-sm">{String(v) || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
