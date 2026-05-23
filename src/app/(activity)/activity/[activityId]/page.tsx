import { Card, Chip, Tooltip } from "@heroui/react";
import { Calendar, ExternalLink, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "~/app/_components/page-header";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import { CreateProcessButton } from "./_components/create-process-button";
import { EditActivityButton } from "./_components/edit-activity-button";
import { ProcessList } from "./_components/process-list";

/**
 * Activity Details & Process Management Page (Server Component)
 *
 * Exposes full management controls for a single Activity:
 * 1. View Activity Metadata (date, memo, area, co-editors list).
 * 2. Edit activity settings (for Creator/Admins/Co-editors).
 * 3. Create, edit, and list processes (flows, check sheets, Web Embeds) under this Activity.
 */
export default async function ActivityPage({
	params,
}: {
	params: Promise<{ activityId: string }>;
}) {
	// ─── 1. EXTRACT ROUTE PARAMETERS & VERIFY SESSION ───────────────────
	const { activityId } = await params;
	const id = parseInt(activityId, 10);
	const session = await getSession();

	// Guard: Redirect to authentication page if no session is active
	if (!session) {
		redirect("/auth");
	}

	// Guard: Return a 404 page if the route ID is invalid
	if (Number.isNaN(id)) {
		notFound();
	}

	// ─── 2. FETCH MAIN ACTIVITY METADATA ────────────────────────────────
	const activity = await api.activity.getById({ id });

	// Guard: Return a 404 page if the activity does not exist
	if (!activity) {
		notFound();
	}

	// ─── 3. PREFETCH DATA FOR SERVER-SIDE HYDRATION ─────────────────────
	// Prefetch the processes list query on the server so that the client component
	// has the data immediately available without layout shifts or loader flashes.
	await api.process.getByActivityId.prefetch({ activityId: id });

	return (
		<HydrateClient>
			<main className="bg-linear-to-b from-background to-content2 p-4 md:p-8">
				<div className="mx-auto max-w-7xl">
					{/* ─── 5. PAGE HEADER & MANAGEMENT CONTROLS ───────────────────── */}
					<PageHeader
						action={
							session && (
								<div className="flex items-center gap-2">
									{/* Button to edit Activity metadata & manage "Co-editors" */}
									<EditActivityButton activity={activity} />
									{/* Button to add a new operational process/sheet flow */}
									<CreateProcessButton activity={activity} />
								</div>
							)
						}
						backHref="/"
						backLabel="活動管理"
						title={activity.name}
					/>

					{/* ─── 6. ACTIVITY DETAILS OVERVIEW CARD ──────────────────────── */}
					<Card className="mb-8 border-none bg-surface/60 p-6 shadow-md backdrop-blur-md">
						<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
							<div className="flex flex-wrap gap-x-8 gap-y-4">
								{/* Activity execution date */}
								<div className="flex items-center gap-2.5">
									<div className="flex size-10 animate-hover-spin items-center justify-center rounded-xl bg-primary/10 text-primary">
										<Calendar className="size-5" />
									</div>
									<div className="flex flex-col">
										<span className="font-semibold text-muted text-xs uppercase tracking-wider">
											活動日期
										</span>
										<span className="font-medium text-foreground text-sm">
											{activity.activityDate}
										</span>
									</div>
								</div>

								{/* Assigned operational area */}
								<div className="flex items-center gap-2.5">
									<div className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
										<MapPin className="size-5" />
									</div>
									<div className="flex flex-col">
										<span className="font-semibold text-muted text-xs uppercase tracking-wider">
											所屬分會
										</span>
										<span className="font-medium text-foreground text-sm">
											{activity.area?.name ?? "未分配"}
										</span>
									</div>
								</div>

								{/* Direct link to the source Google Sheet */}
								<div className="flex items-center gap-2.5">
									<div className="flex size-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
										<ExternalLink className="size-5" />
									</div>
									<div className="flex flex-col">
										<span className="font-semibold text-muted text-xs uppercase tracking-wider">
											Google 試算表
										</span>
										<Link
											className="font-medium text-accent text-sm hover:underline"
											href={`https://docs.google.com/spreadsheets/d/${activity.googleSheetId}`}
											target="_blank"
										>
											開啟連結
										</Link>
									</div>
								</div>
							</div>

							{/* Co-editors (協同編輯者) section */}
							<div className="border-separator border-t pt-4 md:border-t-0 md:pt-0">
								<div className="flex items-start gap-2.5">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
										<Users className="size-5" />
									</div>
									<div className="flex flex-col gap-1.5">
										<span className="font-semibold text-muted text-xs uppercase tracking-wider">
											協同編輯者
										</span>
										<div className="flex flex-wrap gap-1.5">
											{activity.editors && activity.editors.length > 0 ? (
												activity.editors.map((editor) => (
													<Tooltip closeDelay={0} delay={0} key={editor.userId}>
														<Tooltip.Trigger>
															<Chip
																className="font-medium"
																size="sm"
																variant="soft"
															>
																{editor.user?.name ??
																	editor.user?.email ??
																	"協同編輯"}
															</Chip>
														</Tooltip.Trigger>
														<Tooltip.Content placement="top">
															{editor.user?.email}
														</Tooltip.Content>
													</Tooltip>
												))
											) : (
												<span className="text-muted-foreground text-xs italic">
													尚未設定（僅限建立者與管理員可編輯）
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Optional Activity Memo/Remarks */}
						{activity.activityMemo && (
							<div className="mt-6 border-separator border-t pt-4">
								<span className="font-semibold text-muted text-xs uppercase tracking-wider">
									活動備註
								</span>
								<p className="mt-1 text-muted-foreground text-sm">
									{activity.activityMemo}
								</p>
							</div>
						)}
					</Card>

					{/* ─── 7. PROCESSES FLOWS AND LISTS ───────────────────────────── */}
					<div className="space-y-6">
						<h2 className="font-bold text-2xl">項目清單</h2>
						<ProcessList activity={activity} activityId={activity.id} />
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
