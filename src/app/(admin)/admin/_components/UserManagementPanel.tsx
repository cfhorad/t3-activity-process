import {
	Avatar,
	Button,
	Chip,
	cn,
	InputGroup,
	Table,
	TextField,
	Tooltip,
} from "@heroui/react";
import { Edit2, RefreshCw, Search } from "lucide-react";
import type { User } from "~/server/better-auth/config";
import type { UserItem } from "../_hooks/useAdminDashboard";

interface UserManagementPanelProps {
	currentUser: User;
	loadingUsers: boolean;
	filteredUsers: UserItem[] | undefined;
	refetchUsers: () => void;
	userSearch: string;
	setUserSearch: (val: string) => void;
	handleEditClick: (user: UserItem) => void;
}

export function UserManagementPanel({
	currentUser,
	loadingUsers,
	filteredUsers,
	refetchUsers,
	userSearch,
	setUserSearch,
	handleEditClick,
}: UserManagementPanelProps) {
	return (
		<>
			<div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<h4 className="font-bold text-base text-foreground">
					系統成員清單與角色控制
				</h4>
				<div className="flex items-center gap-2">
					<TextField aria-label="搜尋成員" className="w-full max-w-xs">
						<InputGroup>
							<InputGroup.Prefix>
								<Search className="size-4 text-muted" />
							</InputGroup.Prefix>
							<InputGroup.Input
								onChange={(e) => setUserSearch(e.target.value)}
								placeholder="搜尋姓名、信箱、角色、分會..."
								value={userSearch}
							/>
						</InputGroup>
					</TextField>

					<Tooltip closeDelay={0} delay={0}>
						<Tooltip.Trigger>
							<Button
								isIconOnly
								onPress={refetchUsers}
								size="sm"
								variant="ghost"
							>
								<RefreshCw
									className={cn(
										"size-4 text-muted",
										loadingUsers && "animate-spin",
									)}
								/>
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content placement="top">重新整理</Tooltip.Content>
					</Tooltip>
				</div>
			</div>

			{loadingUsers ? (
				<div className="flex flex-col items-center justify-center p-12 text-muted">
					<RefreshCw className="mb-2 size-8 animate-spin" />
					<span>載入成員清單中...</span>
				</div>
			) : !filteredUsers || filteredUsers.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-default-200 border-dashed bg-default-50 p-12 text-muted">
					<RefreshCw className="mb-2 size-12 text-default-300" />
					<span className="font-medium text-sm">
						沒有找到符合搜尋條件的成員
					</span>
				</div>
			) : (
				<div className="overflow-hidden rounded-2xl border border-default-200 shadow-sm">
					<Table>
						<Table.ScrollContainer>
							<Table.Content
								aria-label="系統成員管理"
								className="min-w-[800px]"
							>
								<Table.Header>
									<Table.Column id="member" isRowHeader>
										成員資料
									</Table.Column>
									<Table.Column id="role">系統角色</Table.Column>
									<Table.Column id="status">帳號狀態</Table.Column>
									<Table.Column id="areas">管轄/核准分會</Table.Column>
									<Table.Column className="text-end" id="actions">
										管理操作
									</Table.Column>
								</Table.Header>
								<Table.Body>
									{filteredUsers.map((userItem) => {
										const roleColors: Record<
											string,
											"danger" | "warning" | "success"
										> = {
											ADMIN: "danger",
											MANAGER: "warning",
											VIEWER: "success",
										};

										const statusColors: Record<
											string,
											"success" | "warning" | "danger"
										> = {
											active: "success",
											pending: "warning",
											suspended: "danger",
										};

										const statusLabels = {
											active: "啟用中",
											pending: "待審核",
											suspended: "停權中",
										};

										const fallbackLetter = (
											userItem.name ??
											userItem.email ??
											"M"
										)
											.charAt(0)
											.toUpperCase();

										return (
											<Table.Row id={userItem.id} key={userItem.id}>
												<Table.Cell className="whitespace-nowrap">
													<div className="flex items-center gap-3">
														<Avatar className="size-8 rounded-full">
															{userItem.image ? (
																<Avatar.Image src={userItem.image} />
															) : (
																<Avatar.Fallback>
																	{fallbackLetter}
																</Avatar.Fallback>
															)}
														</Avatar>
														<div>
															<p className="flex items-center gap-1.5 font-bold text-sm">
																{userItem.name ?? "未設定姓名"}
																{userItem.id === currentUser.id && (
																	<Chip
																		className="h-4 text-[10px]"
																		color="accent"
																		size="sm"
																		variant="soft"
																	>
																		你自己
																	</Chip>
																)}
															</p>
															<p className="text-muted text-xs">
																{userItem.email}
															</p>
														</div>
													</div>
												</Table.Cell>
												<Table.Cell className="whitespace-nowrap">
													<Chip
														className="font-bold text-xs"
														color={
															roleColors[userItem.role ?? "VIEWER"] ?? "success"
														}
														variant="soft"
													>
														{userItem.role ?? "VIEWER"}
													</Chip>
												</Table.Cell>
												<Table.Cell className="whitespace-nowrap">
													<Chip
														className="font-bold text-xs"
														color={statusColors[userItem.status] ?? "warning"}
														size="sm"
														variant="soft"
													>
														{statusLabels[userItem.status] ?? userItem.status}
													</Chip>
												</Table.Cell>
												<Table.Cell>
													<div className="flex max-w-[280px] flex-wrap gap-1">
														{userItem.areas && userItem.areas.length > 0 ? (
															userItem.areas.map((ua) => {
																const chipColors = {
																	approved: "success" as const,
																	pending: "warning" as const,
																	rejected: "danger" as const,
																};

																const suffix = {
																	approved: "",
																	pending: " (待核)",
																	rejected: " (拒)",
																};

																return (
																	<Chip
																		className="h-5 px-1 py-0 font-semibold text-xs"
																		color={chipColors[ua.status] ?? "default"}
																		key={ua.areaId}
																		size="sm"
																		variant="secondary"
																	>
																		{ua.area?.name || ua.areaId}
																		{suffix[ua.status] ?? ""}
																	</Chip>
																);
															})
														) : (
															<span className="text-muted text-xs italic">
																無登記分會
															</span>
														)}
													</div>
												</Table.Cell>
												<Table.Cell className="whitespace-nowrap">
													<div className="flex items-center justify-end">
														<Tooltip closeDelay={0} delay={0}>
															<Tooltip.Trigger>
																<Button
																	className="flex items-center gap-1 font-bold"
																	onPress={() => handleEditClick(userItem)}
																	size="sm"
																	variant="ghost"
																>
																	<Edit2 className="size-3.5" /> 編輯
																</Button>
															</Tooltip.Trigger>
															<Tooltip.Content placement="top">
																變更角色與分會權限
															</Tooltip.Content>
														</Tooltip>
													</div>
												</Table.Cell>
											</Table.Row>
										);
									})}
								</Table.Body>
							</Table.Content>
						</Table.ScrollContainer>
					</Table>
				</div>
			)}
		</>
	);
}
