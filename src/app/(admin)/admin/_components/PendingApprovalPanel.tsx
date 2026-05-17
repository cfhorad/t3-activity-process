import {
	Avatar,
	Button,
	Chip,
	cn,
	Spinner,
	Table,
	Tooltip,
} from "@heroui/react";
import { Check, RefreshCw, UserCheck, X } from "lucide-react";
import type { PendingApprovalItem } from "../_hooks/useAdminDashboard";

interface PendingApprovalPanelProps {
	loadingApprovals: boolean;
	pendingApprovals: PendingApprovalItem[] | undefined;
	refetchApprovals: () => void;
	approveMutationPending: boolean;
	rejectMutationPending: boolean;
	handleApprove: (userId: string, areaId: string) => void;
	handleRejectClick: (ua: PendingApprovalItem) => void;
}

export function PendingApprovalPanel({
	loadingApprovals,
	pendingApprovals,
	refetchApprovals,
	approveMutationPending,
	rejectMutationPending,
	handleApprove,
	handleRejectClick,
}: PendingApprovalPanelProps) {
	return (
		<>
			<div className="mb-4 flex items-center justify-between">
				<h4 className="font-bold text-base text-foreground">
					待審核分會申請清單
				</h4>
				<Tooltip closeDelay={0} delay={0}>
					<Tooltip.Trigger>
						<Button
							isIconOnly
							onPress={refetchApprovals}
							size="sm"
							variant="ghost"
						>
							<RefreshCw
								className={cn(
									"size-4 text-muted",
									loadingApprovals && "animate-spin",
								)}
							/>
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content placement="top">重新整理</Tooltip.Content>
				</Tooltip>
			</div>

			{loadingApprovals ? (
				<div className="flex flex-col items-center justify-center p-12 text-muted">
					<RefreshCw className="mb-2 size-8 animate-spin" />
					<span>載入審核清單中...</span>
				</div>
			) : !pendingApprovals || pendingApprovals.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-default-200 border-dashed bg-default-50 p-12 text-muted">
					<UserCheck className="mb-2 size-12 text-default-300" />
					<span className="font-medium text-sm">
						目前沒有待審核的分會申請案件
					</span>
				</div>
			) : (
				<div className="overflow-hidden rounded-2xl border border-default-200 shadow-sm">
					<Table>
						<Table.ScrollContainer>
							<Table.Content
								aria-label="待審核分會申請"
								className="min-w-[650px]"
							>
								<Table.Header>
									<Table.Column id="applicant" isRowHeader>
										申請人
									</Table.Column>
									<Table.Column id="area">申請分會</Table.Column>
									<Table.Column id="status">狀態</Table.Column>
									<Table.Column id="date">申請日期</Table.Column>
									<Table.Column className="text-end" id="actions">
										審核操作
									</Table.Column>
								</Table.Header>
								<Table.Body>
									{pendingApprovals.map((ua) => (
										<Table.Row
											id={`${ua.userId}-${ua.areaId}`}
											key={`${ua.userId}-${ua.areaId}`}
										>
											<Table.Cell>
												<div className="flex items-center gap-3">
													<Avatar className="size-8 rounded-full">
														{ua.user?.image ? (
															<Avatar.Image src={ua.user?.image} />
														) : (
															<Avatar.Fallback>
																{(ua.user?.name ?? ua.user?.email ?? "M")
																	.charAt(0)
																	.toUpperCase()}
															</Avatar.Fallback>
														)}
													</Avatar>
													<div>
														<p className="font-bold text-sm">
															{ua.user?.name ?? "未設定姓名"}
														</p>
														<p className="text-muted text-xs">
															{ua.user?.email}
														</p>
													</div>
												</div>
											</Table.Cell>
											<Table.Cell>
												<Chip
													className="font-bold"
													color="accent"
													variant="soft"
												>
													{ua.area?.name} ({ua.areaId})
												</Chip>
											</Table.Cell>
											<Table.Cell>
												<Chip
													className="font-bold"
													color="warning"
													size="sm"
													variant="soft"
												>
													等待審核
												</Chip>
											</Table.Cell>
											<Table.Cell className="text-muted text-xs">
												{ua.approvedAt
													? new Date(ua.approvedAt).toLocaleString()
													: "剛剛"}
											</Table.Cell>
											<Table.Cell>
												<div className="flex items-center justify-end gap-2">
													<Button
														className="flex items-center gap-1 font-bold text-white shadow-sm"
														isPending={approveMutationPending}
														onPress={() => handleApprove(ua.userId, ua.areaId)}
														size="sm"
														variant="primary"
													>
														{({ isPending }) => (
															<>
																{isPending ? (
																	<Spinner color="current" size="sm" />
																) : (
																	<Check className="size-4" />
																)}
																核准
															</>
														)}
													</Button>
													<Button
														className="flex items-center gap-1 font-bold text-white shadow-sm"
														isPending={rejectMutationPending}
														onPress={() => handleRejectClick(ua)}
														size="sm"
														variant="danger"
													>
														{({ isPending }) => (
															<>
																{isPending ? (
																	<Spinner color="current" size="sm" />
																) : (
																	<X className="size-4" />
																)}
																拒絕
															</>
														)}
													</Button>
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
		</>
	);
}
