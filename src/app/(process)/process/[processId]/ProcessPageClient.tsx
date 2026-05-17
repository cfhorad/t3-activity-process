"use client";

import {
	Button,
	Card,
	Chip,
	Modal,
	Skeleton,
	Spinner,
	Surface,
	Tooltip,
} from "@heroui/react";
import { Bell, Clock, Info, Layers, Phone, Users } from "lucide-react";
import { use } from "react";
import { DataFilterToolbar } from "~/app/_components/data-filter-toolbar";
import { PageHeader } from "~/app/_components/page-header";
import { SyncConfirmDialog } from "~/app/_components/sync-confirm-dialog";
import { calculateDuration, formatTimeDisplay } from "~/lib/time";
import { api } from "~/trpc/react";
import { useProcessData } from "./_hooks/useProcessData";

// ─── SUB-COMPONENTS ───────────────────────────────────────────

/**
 * 1. Process Header Component
 */
interface ProcessHeaderProps {
	processId: number;
	isSyncing: boolean;
	onSync: () => void;
}

function ProcessHeader({ processId, isSyncing, onSync }: ProcessHeaderProps) {
	const { data: process } = api.process.getById.useQuery({ id: processId });

	return (
		<PageHeader
			action={<SyncConfirmDialog isSyncing={isSyncing} onSync={onSync} />}
			backHref={process ? `/activity/${process.activityId}` : "/"}
			backLabel={process?.activity?.name ?? "返回活動"}
			title={process?.name ?? "處理流程"}
		/>
	);
}

/**
 * 2. Skeleton Grid Loading Component
 */
function SkeletonGrid() {
	return (
		<div className="grid grid-cols-1 gap-4 p-4">
			{[1, 2, 3, 4].map((i) => (
				<div
					className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-separator p-6"
					key={i}
				>
					<div className="flex flex-col gap-2">
						<Skeleton className="h-6 w-3/4 rounded-lg" />
						<Skeleton className="h-4 w-1/2 rounded-lg" />
					</div>
					<div className="flex gap-4">
						<Skeleton className="h-10 w-24 rounded-xl" />
						<Skeleton className="h-10 w-24 rounded-xl" />
					</div>
					<div className="mt-4 flex items-center justify-between border-separator border-t pt-4">
						<div className="flex items-center gap-2">
							<Skeleton className="h-8 w-8 rounded-full" />
							<Skeleton className="h-4 w-20 rounded-lg" />
						</div>
						<Skeleton className="h-8 w-24 rounded-lg" />
					</div>
				</div>
			))}
		</div>
	);
}

/**
 * 3. Process Row Details Modal Component
 */
interface DetailsModalProps {
	data: Record<string, string>;
	title: string;
}

function DetailsModal({ data, title }: DetailsModalProps) {
	return (
		<Modal.Backdrop variant="blur">
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-default text-foreground">
							<Info className="size-5" />
						</Modal.Icon>
						<Modal.Heading>{title}</Modal.Heading>
					</Modal.Header>
					<Modal.Body className="p-0">
						<Surface
							className="max-h-[60vh] overflow-y-auto p-6"
							variant="default"
						>
							<div className="flex flex-col gap-4">
								{Object.entries(data).map(([key, value]) => (
									<div className="flex flex-col gap-1" key={key}>
										<span className="font-bold text-[10px] text-muted">
											{key}
										</span>
										<div className="whitespace-pre-wrap font-medium text-sm leading-relaxed">
											{(key === "電話" || key === "手機") && value ? (
												<Tooltip closeDelay={0} delay={0}>
													<Tooltip.Trigger>
														<a
															className="flex w-fit items-center gap-2 rounded-lg bg-success-soft px-3 py-1.5 text-success transition-colors hover:bg-success-soft-hover"
															href={`tel:${value.replace(/\s/g, "")}`}
														>
															<Phone className="size-4" />
															<span className="font-semibold text-xs">
																撥打電話
															</span>
														</a>
													</Tooltip.Trigger>
													<Tooltip.Content placement="top">
														撥打 {value}
													</Tooltip.Content>
												</Tooltip>
											) : (
												value || "-"
											)}
										</div>
									</div>
								))}
							</div>
						</Surface>
					</Modal.Body>
					<Modal.Footer />
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

/**
 * 4. Process Card Component
 */
interface ProcessCardProps {
	row: {
		id: number;
		data: unknown;
	};
}

function ProcessCard({ row }: ProcessCardProps) {
	const data = (row.data as Record<string, string>) ?? {};
	const title = data.主題 ?? "Untitled";
	const footerField: string = "負責人";
	const duration = calculateDuration(data.StartAt, data.EndAt);

	return (
		<Card
			className="group mx-auto h-full w-full max-w-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
			variant="secondary"
		>
			<Card.Header>
				<Card.Title className="line-clamp-2 font-bold text-lg transition-colors group-hover:text-primary">
					{title}
				</Card.Title>
				<div className="card__description mt-4 flex flex-col gap-2.5 text-sm">
					<div className="flex items-center gap-2">
						<Clock className="size-4 text-primary" />
						<div className="flex flex-col">
							<div className="flex flex-col gap-1">
								<span className="font-semibold text-foreground">
									{formatTimeDisplay(data.StartAt)} —{" "}
									{formatTimeDisplay(data.EndAt)}
								</span>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
						<div className="flex items-center gap-2">
							<Bell className="size-4 text-primary" />
							<div className="flex flex-col">
								<div className="flex flex-col gap-1">
									{duration && (
										<Chip
											className="h-auto px-0 font-semibold text-foreground"
											color="success"
											size="sm"
											variant="soft"
										>
											{duration}
										</Chip>
									)}
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Layers className="size-4 text-primary" />
							<div className="flex flex-col">
								<div className="flex flex-wrap gap-1">
									{(data.組別 ?? "-").split(/[,\n\r]+/).map((g) => (
										<Chip
											color="accent"
											key={g.trim()}
											size="sm"
											variant="soft"
										>
											{g.trim()}
										</Chip>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</Card.Header>
			<Card.Footer className="mt-auto flex items-center justify-between gap-2 border-separator border-t pt-4">
				<div className="flex items-center gap-2">
					<div className="rounded-full bg-primary/10 p-2">
						<Users className="size-4 text-primary" />
					</div>
					<div className="flex flex-col">
						<span className="font-bold text-sm">
							{(footerField === "電話" || footerField === "手機") &&
							data[footerField] ? (
								<Tooltip closeDelay={0} delay={0}>
									<Tooltip.Trigger>
										<a
											className="flex size-8 items-center justify-center rounded-full bg-success-soft text-success transition-colors hover:bg-success-soft-hover"
											href={`tel:${data[footerField].replace(/\s/g, "")}`}
										>
											<Phone className="size-4" />
										</a>
									</Tooltip.Trigger>
									<Tooltip.Content placement="top">
										撥打 {data[footerField]}
									</Tooltip.Content>
								</Tooltip>
							) : (
								(data[footerField] ?? "-")
							)}
						</span>
					</div>
				</div>

				<Modal>
					<Button className="font-semibold" size="sm" variant="tertiary">
						<Info className="size-3.5" />
						詳細資訊
					</Button>
					<DetailsModal data={data} title={title} />
				</Modal>
			</Card.Footer>
		</Card>
	);
}

// ─── MAIN PRESENTATIONAL COMPONENT ───────────────────────────

export function ProcessPageClient({
	params,
}: {
	params: Promise<{ processId: string }>;
}) {
	const { processId } = use(params);
	const id = parseInt(processId, 10);

	const {
		search,
		setSearch,
		selectedFilters,
		updateFilter,
		syncedData,
		isQueryLoading,
		syncMutation,
		handleSync,
		filterableColumns,
	} = useProcessData(id);

	return (
		<main className="bg-linear-to-b from-background to-surface-secondary p-4 md:p-8">
			<div className="mx-auto flex max-w-7xl flex-col gap-6">
				<ProcessHeader
					isSyncing={syncMutation.isPending}
					onSync={handleSync}
					processId={id}
				/>

				<DataFilterToolbar
					filterableColumns={filterableColumns}
					onFilterChange={updateFilter}
					onSearchChange={setSearch}
					processId={id}
					search={search}
					selectedFilters={selectedFilters}
				/>

				<Card className="mx-auto w-full max-w-2xl border-none bg-surface shadow-md">
					{isQueryLoading ? (
						<SkeletonGrid />
					) : syncedData && syncedData.length > 0 ? (
						<div className="grid grid-cols-1 gap-4 p-4">
							{syncedData.map((row) => (
								<ProcessCard key={row.id} row={row} />
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center gap-4 p-20 text-center">
							<div className="rounded-full bg-default-100 p-4">
								<Spinner className="opacity-50" color="current" size="lg" />
							</div>
							<div className="space-y-1">
								<p className="font-semibold text-xl">
									{syncMutation.isPending
										? "Syncing Data..."
										: "No Data Synced"}
								</p>
								<p className="mx-auto max-w-xs text-muted">
									{syncMutation.isPending
										? "Please wait while we fetch the latest data from Google Sheets for the first time."
										: "Your local database is currently empty. Start by syncing from Google Sheets."}
								</p>
							</div>
							{!syncMutation.isPending && (
								<Button
									isPending={syncMutation.isPending}
									onPress={handleSync}
									variant="tertiary"
								>
									Start First Sync
								</Button>
							)}
						</div>
					)}
				</Card>
			</div>
		</main>
	);
}
