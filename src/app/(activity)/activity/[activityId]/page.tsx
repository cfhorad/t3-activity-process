import { Card, Chip, Tooltip } from "@heroui/react";
import { and, eq } from "drizzle-orm";
import { Calendar, ExternalLink, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "~/app/_components/page-header";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { userAreas } from "~/server/db/schema";
import { api, HydrateClient } from "~/trpc/server";
import { CreateProcessButton } from "./_components/create-process-button";
import { EditActivityButton } from "./_components/edit-activity-button";
import { ProcessList } from "./_components/process-list";

export default async function ActivityPage({
	params,
}: {
	params: Promise<{ activityId: string }>;
}) {
	const { activityId } = await params;
	const id = parseInt(activityId, 10);
	const session = await getSession();

	if (!session) {
		redirect("/auth");
	}

	if (Number.isNaN(id)) {
		notFound();
	}

	const activity = await api.activity.getById({ id });

	if (!activity) {
		notFound();
	}

	// Fetch approved areaIds for current user
	const approvedAreas = await db
		.select({ areaId: userAreas.areaId })
		.from(userAreas)
		.where(
			and(
				eq(userAreas.userId, session.user.id),
				eq(userAreas.status, "approved"),
			),
		);
	const areaIds = approvedAreas.map((a) => a.areaId);

	const userWithAreas = {
		...session.user,
		areaIds,
	};

	await api.process.getByActivityId.prefetch({ activityId: id });

	return (
		<HydrateClient>
			<main className="bg-linear-to-b from-background to-content2 p-4 md:p-8">
				<div className="mx-auto max-w-7xl">
					<PageHeader
						action={
							session && (
								<div className="flex items-center gap-2">
									<EditActivityButton
										activity={activity}
										user={userWithAreas}
									/>
									<CreateProcessButton
										activity={activity}
										user={userWithAreas}
									/>
								</div>
							)
						}
						backHref="/"
						backLabel="活動管理"
						title={activity.name}
					/>

					{/* Activity Details Overview Card */}
					<Card className="mb-8 border-none bg-surface/60 p-6 shadow-md backdrop-blur-md">
						<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
							<div className="flex flex-wrap gap-x-8 gap-y-4">
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
											{activity.leaders && activity.leaders.length > 0 ? (
												activity.leaders.map((leader) => (
													<Tooltip closeDelay={0} delay={0} key={leader.userId}>
														<Tooltip.Trigger>
															<Chip
																className="font-medium"
																size="sm"
																variant="soft"
															>
																{leader.user?.name ??
																	leader.user?.email ??
																	"協同編輯"}
															</Chip>
														</Tooltip.Trigger>
														<Tooltip.Content placement="top">
															{leader.user?.email}
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

					<div className="space-y-6">
						<h2 className="font-bold text-2xl">項目清單</h2>
						<ProcessList
							activity={activity}
							activityId={activity.id}
							user={userWithAreas}
						/>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
