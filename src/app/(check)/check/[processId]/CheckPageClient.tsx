"use client";

import { Card, Spinner, Tabs } from "@heroui/react";
import { BarChart3, List } from "lucide-react";
import { use } from "react";
import { DataFilterToolbar } from "~/app/_components/data-filter-toolbar";
import { PageHeader } from "~/app/_components/page-header";
import { SyncConfirmDialog } from "~/app/_components/sync-confirm-dialog";
import { useAuth } from "~/app/_hooks/useAuth";
import { api } from "~/trpc/react";
import { CheckboxStatsTable } from "./_components/CheckboxStatsTable";
import { CheckListTable } from "./_components/CheckListTable";
import { useCheckData } from "./_hooks/useCheckData";

// ─── SUB-COMPONENTS ───────────────────────────────────────────

/**
 * 1. Check Header Component
 */
interface CheckHeaderProps {
	processId: number;
	isSyncing: boolean;
	onSync: () => void;
}

function CheckHeader({ processId, isSyncing, onSync }: CheckHeaderProps) {
	const { data: process } = api.process.getById.useQuery({ id: processId });
	const { isActivityEditor } = useAuth();

	const isAuthorized = isActivityEditor(
		process?.activityId,
		process?.activity?.createdById,
		process?.activity?.areaId,
	);

	return (
		<PageHeader
			action={
				isAuthorized ? (
					<SyncConfirmDialog isSyncing={isSyncing} onSync={onSync} />
				) : undefined
			}
			backHref={process ? `/activity/${process.activityId}` : "/"}
			backLabel={process?.activity?.name ?? "返回活動"}
			title={process?.name ?? "報到清單"}
		/>
	);
}

// ─── MAIN PRESENTATIONAL COMPONENT ───────────────────────────

export function CheckPageClient({
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
		sortedData,
		columns,
		isQueryLoading,
		syncMutation,
		handleSync,
		filterableColumns,
		updateCheckbox,
		visibleColumns,
		visibleColumnNames,
		setVisibleColumnNames,
		handleSaveVisibleColumns,
		isSavingVisibleColumns,
		handleManualRefetch,
	} = useCheckData(id);

	return (
		<main className="bg-linear-to-b from-background to-surface-secondary p-4 md:p-8">
			<div className="mx-auto flex max-w-7xl flex-col gap-6">
				<CheckHeader
					isSyncing={syncMutation.isPending}
					onSync={handleSync}
					processId={id}
				/>

				<DataFilterToolbar
					filterableColumns={filterableColumns}
					filterType="check"
					onFilterChange={updateFilter}
					onSearchChange={setSearch}
					processId={id}
					search={search}
					selectedFilters={selectedFilters}
				/>

				<Tabs variant="secondary">
					<Tabs.ListContainer>
						<Tabs.List aria-label="核取選項">
							<Tabs.Tab id="data-list">
								<div className="flex items-center gap-2">
									<List className="size-4 text-blue-500" />
									<span>數據清單</span>
								</div>
								<Tabs.Indicator />
							</Tabs.Tab>
							<Tabs.Tab id="statistics">
								<div className="flex items-center gap-2">
									<BarChart3 className="size-4 text-orange-500" />
									<span>統計數據</span>
								</div>
								<Tabs.Indicator />
							</Tabs.Tab>
						</Tabs.List>
					</Tabs.ListContainer>

					<Tabs.Panel id="data-list">
						<div className="flex flex-col gap-6 pt-6">
							<Card className="mx-auto w-full max-w-7xl overflow-hidden border-none bg-surface p-6 shadow-md">
								{isQueryLoading ? (
									<div className="flex h-64 items-center justify-center">
										<Spinner size="lg" />
									</div>
								) : syncedData && syncedData.length > 0 ? (
									<CheckListTable
										allColumns={columns}
										data={sortedData}
										isSavingVisibleColumns={isSavingVisibleColumns}
										onCheckboxChange={updateCheckbox}
										onSaveVisibleColumns={handleSaveVisibleColumns}
										onVisibleColumnsChange={setVisibleColumnNames}
										processId={id}
										visibleColumnNames={visibleColumnNames}
										visibleColumns={visibleColumns}
									/>
								) : (
									<div className="flex flex-col items-center justify-center gap-4 p-20 text-center">
										<div className="rounded-full bg-default-100 p-4">
											<Spinner
												className="opacity-50"
												color="current"
												size="lg"
											/>
										</div>
										<div className="space-y-1">
											<p className="font-semibold text-xl">
												{syncMutation.isPending ? "同步數據中..." : "無數據"}
											</p>
											<p className="mx-auto max-w-xs text-muted">
												{syncMutation.isPending
													? "請稍候，我們正在首次從 Google 試算表獲取最新數據。"
													: "您的本地資料庫目前是空的。"}
											</p>
										</div>
									</div>
								)}
							</Card>
						</div>
					</Tabs.Panel>

					<Tabs.Panel id="statistics">
						<div className="pt-6">
							<Card className="mx-auto w-full max-w-7xl border-none bg-surface p-6 shadow-md">
								<CheckboxStatsTable
									columns={columns}
									data={syncedData ?? []}
									isRefetching={isQueryLoading}
									onRefetch={handleManualRefetch}
								/>
							</Card>
						</div>
					</Tabs.Panel>
				</Tabs>
			</div>
		</main>
	);
}
