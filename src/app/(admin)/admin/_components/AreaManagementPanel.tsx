import {
	Button,
	Card,
	Chip,
	cn,
	Description,
	Input,
	Label,
	Spinner,
	Table,
	TextField,
	Tooltip,
} from "@heroui/react";
import { AlertTriangle, Globe, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import type { AreaItem } from "../_hooks/useAdminDashboard";

interface AreaManagementPanelProps {
	isSuperAdmin: boolean;
	loadingAreas: boolean;
	areas: AreaItem[] | undefined;
	refetchAreas: () => void;
	createAreaMutationPending: boolean;
	deleteAreaMutationPending: boolean;
	newAreaId: string;
	setNewAreaId: (val: string) => void;
	newAreaName: string;
	setNewAreaName: (val: string) => void;
	handleCreateArea: (e: FormEvent) => void;
	handleDeleteArea: (id: string, name: string) => void;
}

export function AreaManagementPanel({
	isSuperAdmin,
	loadingAreas,
	areas,
	refetchAreas,
	createAreaMutationPending,
	deleteAreaMutationPending,
	newAreaId,
	setNewAreaId,
	newAreaName,
	setNewAreaName,
	handleCreateArea,
	handleDeleteArea,
}: AreaManagementPanelProps) {
	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
			{/* Left: Area creation form */}
			<div className="space-y-4 lg:col-span-1">
				<Card className="border-default-200 bg-default-50 p-4 shadow-sm">
					<h4 className="mb-3 flex items-center gap-1.5 font-bold text-foreground text-sm">
						<Plus className="size-4 text-primary" />
						新增系統營運地區
					</h4>
					{!isSuperAdmin ? (
						<div className="flex items-start gap-2 rounded-xl border border-warning-soft/20 bg-warning-soft/10 p-3 text-warning text-xs">
							<AlertTriangle className="mt-0.5 size-4 shrink-0" />
							<span>
								僅「超級管理員
								(ADMIN)」可以新增、編輯或刪除地區。您目前的權限等級不足。
							</span>
						</div>
					) : (
						<form className="space-y-4" onSubmit={handleCreateArea}>
							<TextField isRequired name="newAreaId">
								<Label>地區代碼 ID</Label>
								<Input
									onChange={(e) => setNewAreaId(e.target.value)}
									placeholder="例如: CENTRAL 或 EAST"
									value={newAreaId}
								/>
								<Description>英文大寫字串，不可與其他代碼重複</Description>
							</TextField>
							<TextField isRequired name="newAreaName">
								<Label>地區顯示名稱</Label>
								<Input
									onChange={(e) => setNewAreaName(e.target.value)}
									placeholder="例如: 中區 或 東部地區"
									value={newAreaName}
								/>
								<Description>顯示於下拉選單與儀表板上的中文名稱</Description>
							</TextField>
							<Button
								className="flex w-full items-center justify-center gap-1 font-bold text-white shadow-sm"
								isPending={createAreaMutationPending}
								type="submit"
								variant="primary"
							>
								{({ isPending }) => (
									<>
										{isPending ? (
											<Spinner color="current" size="sm" />
										) : (
											<Plus className="size-4" />
										)}
										建立新地區
									</>
								)}
							</Button>
						</form>
					)}
				</Card>
			</div>

			{/* Right: Area List */}
			<div className="space-y-4 lg:col-span-2">
				<div className="mb-1 flex items-center justify-between">
					<h4 className="font-bold text-foreground text-sm">
						當前系統營運地區清單
					</h4>
					<Tooltip closeDelay={0} delay={0}>
						<Tooltip.Trigger>
							<Button
								isIconOnly
								onPress={refetchAreas}
								size="sm"
								variant="ghost"
							>
								<RefreshCw
									className={cn(
										"size-4 text-muted",
										loadingAreas && "animate-spin",
									)}
								/>
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content placement="top">重新整理</Tooltip.Content>
					</Tooltip>
				</div>

				{loadingAreas ? (
					<div className="flex flex-col items-center justify-center p-12 text-muted">
						<RefreshCw className="mb-2 size-8 animate-spin" />
						<span>載入地區中...</span>
					</div>
				) : !areas || areas.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border border-default-200 border-dashed bg-default-50 p-12 text-muted">
						<Globe className="mb-2 size-12 text-default-300" />
						<span className="font-medium text-sm">
							系統目前沒有地區，請新增！
						</span>
					</div>
				) : (
					<div className="overflow-hidden rounded-2xl border border-default-200 shadow-sm">
						<Table>
							<Table.ScrollContainer>
								<Table.Content aria-label="營運地區" className="w-full">
									<Table.Header>
										<Table.Column id="areaId" isRowHeader>
											地區 ID / 代碼
										</Table.Column>
										<Table.Column id="areaName">地區顯示名稱</Table.Column>
										<Table.Column className="text-end" id="actions">
											管理操作
										</Table.Column>
									</Table.Header>
									<Table.Body>
										{areas.map((a) => (
											<Table.Row id={a.id} key={a.id}>
												<Table.Cell className="font-bold text-primary text-sm">
													{a.id}
												</Table.Cell>
												<Table.Cell>
													<Chip
														className="font-bold"
														color="accent"
														variant="soft"
													>
														{a.name}
													</Chip>
												</Table.Cell>
												<Table.Cell>
													<div className="flex items-center justify-end">
														{a.id === "ALL" ? (
															<span className="p-2 text-muted text-xs italic">
																系統預設
															</span>
														) : (
															<Tooltip closeDelay={0} delay={0}>
																<Tooltip.Trigger>
																	<Button
																		isDisabled={
																			!isSuperAdmin || deleteAreaMutationPending
																		}
																		isIconOnly
																		onPress={() =>
																			handleDeleteArea(a.id, a.name)
																		}
																		size="sm"
																		variant="danger-soft"
																	>
																		<Trash2 className="size-4" />
																	</Button>
																</Tooltip.Trigger>
																<Tooltip.Content placement="top">
																	{isSuperAdmin ? "刪除此地區" : "權限不足"}
																</Tooltip.Content>
															</Tooltip>
														)}
													</div>
												</Table.Cell>
											</Table.Row>
										))}
									</Table.Body>
								</Table.Content>
							</Table.ScrollContainer>
						</Table>
					</div>
				)}
			</div>
		</div>
	);
}
