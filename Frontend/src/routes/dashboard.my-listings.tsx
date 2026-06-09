import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { useAuth } from "@/stores/auth";
import { formatCurrency } from "@/lib/currency";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/my-listings")({
  head: () => ({ meta: [{ title: "My Listings - Roomzly Dashboard" }] }),
  component: MyListings,
});

function MyListings() {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const canManageListings = user?.role === "OWNER" || user?.role === "ADMIN";
  const listingsQuery = useQuery({
    queryKey: ["owner-listings"],
    queryFn: propertiesApi.ownerListings,
    enabled: canManageListings,
  });
  const deleteMutation = useMutation({
    mutationFn: propertiesApi.remove,
    onSuccess: () => {
      toast.success("Listing deleted");
      queryClient.invalidateQueries({ queryKey: ["owner-listings"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not delete listing");
    },
  });

  const listings = listingsQuery.data ?? [];

  if (!canManageListings) {
    return (
      <div className="p-4 sm:p-6 md:p-10 animate-fade-in">
        <p className="text-mono-eyebrow mb-3">Owner access required</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter font-bold">My Listings</h1>
        <p className="text-sm text-muted-foreground mt-2">Only owners and admins can manage property listings.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 animate-fade-in">
      <div className="flex items-start sm:items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-mono-eyebrow mb-2">Inventory</p>
          <h1 className="font-display text-3xl md:text-4xl tracking-tighter font-bold">My Listings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {listingsQuery.isLoading ? "Loading listings" : `${listings.length} active properties`}
          </p>
        </div>
        <Link
          to="/dashboard/add-property"
          className="bg-accent text-accent-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="size-3.5" /> Add property
        </Link>
      </div>

      <div className="border border-border overflow-x-auto rounded-sm">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-surface">
            <tr className="border-b border-border">
              {["Property", "Location", "Price", "Status", "Reviews", ""].map((h) => (
                <th key={h} className="text-left p-4 text-mono-eyebrow whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="size-12 object-cover border border-border shrink-0" />
                    ) : (
                      <Link
                        to="/dashboard/edit-property/$id"
                        params={{ id: p.id }}
                        className="size-12 border border-dashed border-border bg-background grid place-items-center text-[9px] font-mono uppercase tracking-widest text-muted-foreground text-center leading-tight shrink-0 hover:border-accent hover:text-accent"
                      >
                        Add photos
                      </Link>
                    )}
                    <div className="min-w-0">
                      <Link
                        to="/listing/$slug"
                        params={{ slug: p.slug }}
                        className="font-medium hover:text-accent transition-colors truncate block"
                      >
                        {p.title}
                      </Link>
                      <p className="text-[10px] font-mono text-muted-foreground">{p.code}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground whitespace-nowrap">{p.city}</td>
                <td className="p-4 font-mono whitespace-nowrap">{formatCurrency(p.price)}</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
                    <span className="size-1.5 rounded-full bg-accent" /> Live
                  </span>
                </td>
                <td className="p-4 font-mono text-muted-foreground">{p.reviews}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Link
                      to="/dashboard/edit-property/$id"
                      params={{ id: p.id }}
                      aria-label={`Edit ${p.title}`}
                      className="size-8 grid place-items-center hover:bg-surface-hi rounded-sm transition-colors"
                    >
                      <Edit className="size-4" />
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button aria-label="Options" className="size-8 grid place-items-center hover:bg-surface-hi rounded-sm transition-colors">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove{" "}
                            <span className="font-medium text-foreground">{p.title}</span>{" "}
                            from your active portfolio.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(p.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center gap-2"
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {listingsQuery.isLoading && (
              <tr>
                <td colSpan={6} className="p-16 text-center">
                  <p className="text-mono-eyebrow">Loading listings</p>
                </td>
              </tr>
            )}
            {!listingsQuery.isLoading && listings.length === 0 && (
              <tr>
                <td colSpan={6} className="p-16 text-center">
                  <p className="text-mono-eyebrow mb-3">No listings</p>
                  <p className="text-sm text-muted-foreground mb-6">You have not added any properties yet.</p>
                  <Link
                    to="/dashboard/add-property"
                    className="bg-accent text-accent-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm inline-flex items-center gap-2"
                  >
                    <Plus className="size-3.5" /> Add your first property
                  </Link>
                </td>
              </tr>
            )}
            {listingsQuery.isError && (
              <tr>
                <td colSpan={6} className="p-16 text-center">
                  <p className="text-mono-eyebrow mb-3">Could not load listings</p>
                  <button
                    type="button"
                    onClick={() => listingsQuery.refetch()}
                    className="bg-foreground text-background px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
