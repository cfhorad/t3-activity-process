"use client";

import { Card, Spinner, Tabs } from "@heroui/react";
import { BarChart3, List } from "lucide-react";
import { use } from "react";
import { DataFilterToolbar } from "~/app/_components/data-filter-toolbar";
import { CheckboxStatsTable } from "./_components/CheckboxStatsTable";
import { CheckHeader } from "./_components/CheckHeader";
import { CheckListTable } from "./_components/CheckListTable";
import { useCheckData } from "./_hooks/useCheckData";

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
		<main className="bg-linear-to-b from-background to-content2 p-4 md:p-8">
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
							<Card className="mx-auto w-full max-w-7xl overflow-hidden border-none bg-content1 p-6 shadow-md">
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
												{syncMutation.isPending
													? "同步數據中..."
													: "尚未同步數據"}
											</p>
											<p className="mx-auto max-w-xs text-muted-foreground">
												{syncMutation.isPending
													? "請稍候，我們正在首次從 Google 試算表獲取最新數據。"
													: "您的本地資料庫目前是空的。請從 Google 試算表開始同步。"}
											</p>
										</div>
									</div>
								)}
							</Card>
						</div>
					</Tabs.Panel>

					<Tabs.Panel id="statistics">
						<div className="pt-6">
							<Card className="mx-auto w-full max-w-7xl border-none bg-content1 p-6 shadow-md">
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
