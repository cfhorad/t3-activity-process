"use client";

import {
	Button,
	Card,
	Chip,
	Form,
	Label,
	ListBox,
	Select,
	Spinner,
} from "@heroui/react";
import {
	CheckCircle2,
	Clock,
	Info,
	Plus,
	ShieldAlert,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/app/_hooks/useAuth";
import type { User } from "~/server/better-auth/config";
import type { AreaStatusItem } from "../_hooks/usePendingApproval";
import { usePendingApproval } from "../_hooks/usePendingApproval";

// ─── SUB-COMPONENTS ───────────────────────────────────────────

/**
 * 1. Top Header Card Component
 */
interface PendingHeaderCardProps {
	user: User;
}

function PendingHeaderCard({ user }: PendingHeaderCardProps) {
	return (
		<Card className="border border-border/40 bg-surface/60 p-4 backdrop-blur-md">
			<div className="flex flex-col items-center justify-center gap-2 text-center">
				<div className="rounded-2xl bg-primary/10 p-3 text-primary">
					<ShieldAlert className="size-6 animate-pulse" />
				</div>
				<div className="space-y-1">
					<h1 className="font-bold text-foreground text-xl">
						分會審核與權限開通
					</h1>
					<p className="text-muted text-xs">
						歡迎 {user.name} ({user.email})
					</p>
				</div>
			</div>
		</Card>
	);
}

/**
 * 2. Onboarding / Apply Form Component
 */
interface OnboardingApplyFormProps {
	isApplyingMore: boolean;
	availableToApply: { id: string; name: string }[];
	selectedAreaIds: string[];
	onSelectionChange: (ids: string[]) => void;
	hasApplications: boolean;
	isPending: boolean;
	onSubmit: (e: React.FormEvent) => void;
	onCancel: () => void;
}

function OnboardingApplyForm({
	isApplyingMore,
	availableToApply,
	selectedAreaIds,
	onSelectionChange,
	hasApplications,
	isPending,
	onSubmit,
	onCancel,
}: OnboardingApplyFormProps) {
	return (
		<Card className="border border-border/40 bg-surface/80 p-4 backdrop-blur-lg">
			<div className="space-y-4">
				<div>
					<h2 className="font-bold text-foreground text-lg">
						{isApplyingMore ? "申請加入其他分會" : "選擇您所屬的分會"}
					</h2>
					<p className="mt-1 text-muted text-sm">
						本系統採分會權限管理，請選擇您需要存取、報到或管理的分會。
					</p>
				</div>

				{availableToApply.length === 0 ? (
					<div className="rounded-xl bg-surface-secondary p-8 text-center text-muted text-sm">
						目前沒有可申請的其他分會。
					</div>
				) : (
					<Form className="space-y-6" onSubmit={onSubmit}>
						<div className="space-y-2">
							<Select
								aria-label="選擇所屬分會"
								onChange={(keys) => {
									const keysArray = Array.isArray(keys)
										? keys
										: keys
											? [keys]
											: [];
									onSelectionChange(keysArray.map(String));
								}}
								placeholder="請選擇分會"
								selectionMode="multiple"
								value={selectedAreaIds}
								variant="secondary"
							>
								<Label className="font-medium text-foreground text-sm">
									可申請的分會 (可複選)
								</Label>
								<Select.Trigger>
									<Select.Value>
										{({ state }) => {
											if (state.selectedItems.length === 0) {
												return "選擇所屬分會";
											}
											return state.selectedItems
												.map((item) => item.textValue)
												.join("、");
										}}
									</Select.Value>
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox selectionMode="multiple">
										{availableToApply.map((area) => (
											<ListBox.Item
												id={area.id}
												key={area.id}
												textValue={area.name}
											>
												<span className="font-medium text-sm">{area.name}</span>
												<ListBox.ItemIndicator />
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
						</div>

						<div className="flex gap-3">
							{hasApplications && (
								<Button
									className="flex-1 font-medium"
									onPress={onCancel}
									variant="secondary"
								>
									返回狀態列表
								</Button>
							)}
							<Button
								className="flex-1 font-bold text-white"
								isDisabled={selectedAreaIds.length === 0}
								isPending={isPending}
								type="submit"
								variant="primary"
							>
								送出分會審核申請
							</Button>
						</div>
					</Form>
				)}
			</div>
		</Card>
	);
}

/**
 * 3. Application Status Card Component
 */
interface ApplicationStatusCardProps {
	myApplications?: AreaStatusItem[];
	availableToApplyCount: number;
	onApplyMore: () => void;
	onRefresh: () => void;
	isSuperAdmin: boolean;
}

function ApplicationStatusCard({
	myApplications,
	availableToApplyCount,
	onApplyMore,
	onRefresh,
	isSuperAdmin,
}: ApplicationStatusCardProps) {
	return (
		<Card className="border border-border/40 bg-surface/80 p-4 backdrop-blur-lg">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-foreground text-lg">
							您目前的分會審核狀態
						</h2>
						<p className="mt-1 text-muted text-sm">
							管理員正在審核您的申請，完成後您將自動獲得該分會的活動存取權限。
						</p>
					</div>
					{!isSuperAdmin && availableToApplyCount > 0 && (
						<Button
							className="flex items-center gap-1 font-semibold text-xs"
							onPress={onApplyMore}
							variant="secondary"
						>
							<Plus className="size-3.5" />
							加入其他分會
						</Button>
					)}
				</div>

				<div className="divide-y divide-separator/20 rounded-2xl border border-border/40 bg-background/40">
					{myApplications?.map((app) => (
						<div
							className="flex flex-row flex-nowrap items-center justify-between gap-3 p-3"
							key={app.areaId}
						>
							<div className="flex min-w-0 items-center gap-2">
								{app.status === "approved" && (
									<div className="rounded-full bg-success-soft/20 p-2 text-success">
										<CheckCircle2 className="size-5" />
									</div>
								)}
								{app.status === "pending" && (
									<div className="animate-pulse rounded-full bg-warning-soft/20 p-2 text-warning">
										<Clock className="size-5" />
									</div>
								)}
								{app.status === "rejected" && (
									<div className="rounded-full bg-danger-soft/20 p-2 text-danger">
										<XCircle className="size-5" />
									</div>
								)}
								<div className="min-w-0">
									<h3 className="font-bold text-foreground text-sm">
										{app.area.name}
									</h3>
									{app.status === "rejected" && app.rejectedReason && (
										<p className="mt-0.5 text-danger text-xs">
											退回原因: {app.rejectedReason}
										</p>
									)}
								</div>
							</div>

							<div className="shrink-0">
								{app.status === "approved" && (
									<Chip className="font-semibold" color="success" size="sm">
										已開通
									</Chip>
								)}
								{app.status === "pending" && (
									<Chip className="font-semibold" color="warning" size="sm">
										審核中
									</Chip>
								)}
								{app.status === "rejected" && (
									<Chip className="font-semibold" color="danger" size="sm">
										被退回
									</Chip>
								)}
							</div>
						</div>
					))}
				</div>

				<div className="flex items-center justify-between rounded-xl bg-surface-secondary p-4 text-muted text-xs">
					<span className="flex items-center gap-2 font-medium">
						<Info className="size-4 shrink-0" />
						當您至少有一個分會審核通過 (已開通) 後，您即可進入儀表板查看活動！
					</span>
					<Button
						className="font-semibold text-xs"
						onPress={onRefresh}
						variant="secondary"
					>
						重新整理狀態
					</Button>
				</div>
			</div>
		</Card>
	);
}

interface PendingApprovalClientProps {
	user: User;
}

// ─── MAIN PRESENTATIONAL COMPONENT ───────────────────────────
export function PendingApprovalClient({ user }: PendingApprovalClientProps) {
	const router = useRouter();

	const {
		isLoading,
		myApplications,
		availableToApply,
		selectedAreaIds,
		setSelectedAreaIds,
		isApplyingMore,
		setIsApplyingMore,
		applyMutation,
		hasApplications,
		showOnboardingForm,
		handleSubmit,
	} = usePendingApproval({ userId: user.id });

	const { isSuperAdmin } = useAuth();

	if (isLoading) {
		return (
			<div className="flex flex-col items-center gap-3 py-24">
				<Spinner size="lg" />
				<p className="text-muted text-sm">載入中，請稍候...</p>
			</div>
		);
	}

	return (
		<div className="w-full max-w-2xl space-y-4">
			{/* Top Header Section */}
			<PendingHeaderCard user={user} />

			{/* Form / Status Switching Content */}
			{showOnboardingForm ? (
				<OnboardingApplyForm
					availableToApply={availableToApply}
					hasApplications={hasApplications}
					isApplyingMore={isApplyingMore}
					isPending={applyMutation.isPending}
					onCancel={() => setIsApplyingMore(false)}
					onSelectionChange={setSelectedAreaIds}
					onSubmit={handleSubmit}
					selectedAreaIds={selectedAreaIds}
				/>
			) : (
				<ApplicationStatusCard
					availableToApplyCount={
						availableToApply.length - (myApplications?.length ?? 0)
					}
					isSuperAdmin={!!isSuperAdmin}
					myApplications={myApplications}
					onApplyMore={() => setIsApplyingMore(true)}
					onRefresh={() => router.refresh()}
				/>
			)}
		</div>
	);
}
