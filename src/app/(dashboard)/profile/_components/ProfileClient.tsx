"use client";

import {
	Avatar,
	Button,
	Card,
	Chip,
	Form,
	Input,
	Label,
	ListBox,
	Select,
	Spinner,
	toast,
} from "@heroui/react";
import {
	ArrowLeft,
	CheckCircle2,
	Clock,
	Info,
	Mail,
	MapPin,
	Plus,
	Save,
	Shield,
	User,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "~/app/_hooks/useAuth";
import type { User as AuthUser } from "~/server/better-auth/config";
import { api } from "~/trpc/react";

interface ProfileClientProps {
	user: AuthUser;
}

export function ProfileClient({ user }: ProfileClientProps) {
	const router = useRouter();
	const utils = api.useUtils();

	// 1. Fetch public list of areas
	const { data: publicAreas, isLoading: isAreasLoading } =
		api.user.getPublicAreas.useQuery();

	// 2. Fetch current user's area statuses
	const { data: myApplications, isLoading: isAppsLoading } =
		api.user.getMyAreaStatuses.useQuery();

	const [name, setName] = useState(user.name || "");
	const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

	// Sync applied areas to selectedAreaIds on load
	useEffect(() => {
		if (myApplications) {
			setSelectedAreaIds(myApplications.map((app) => app.areaId));
		}
	}, [myApplications]);

	const updateProfileMutation = api.user.updateProfile.useMutation({
		onSuccess: async () => {
			toast.success("個人資料與分會申請已更新成功！");
			await utils.user.getMyAreaStatuses.invalidate();
			router.refresh();
		},
		onError: (err) => {
			toast.danger(`更新失敗: ${err.message}`);
		},
	});

	const { isAdmin, isSuperAdmin, approvedAreaIds } = useAuth();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.danger("姓名不能為空！");
			return;
		}
		if (!isAdmin && selectedAreaIds.length === 0) {
			toast.danger("請至少選擇一個營運分會！");
			return;
		}
		updateProfileMutation.mutate({
			name: name.trim(),
			areaIds: selectedAreaIds,
		});
	};

	const isLoading = isAreasLoading || isAppsLoading;

	const roleLabel = (() => {
		const role = (user as { role?: string }).role?.toUpperCase();
		if (role === "ADMIN") {
			return isSuperAdmin ? "超級管理員" : "管理員";
		}
		if (role === "MANAGER") return "組長";
		return "一般檢視者";
	})();

	const roleColor = (() => {
		const role = (user as { role?: string }).role?.toUpperCase();
		if (role === "ADMIN") return "danger" as const;
		if (role === "MANAGER") return "warning" as const;
		return "default" as const;
	})();

	if (isLoading) {
		return (
			<div className="flex flex-col items-center gap-3 py-24">
				<Spinner size="lg" />
				<p className="text-muted text-sm">載入個人設定中，請稍候...</p>
			</div>
		);
	}

	return (
		<div className="w-full max-w-2xl space-y-4">
			{/* Top Header Card */}
			<Card className="border border-border/40 bg-surface/60 p-4 backdrop-blur-md">
				<div className="flex items-center gap-4">
					<Avatar className="size-16 border-2 border-primary/20">
						<Avatar.Image alt={user.name} src={user.image ?? undefined} />
						<Avatar.Fallback className="text-xl">
							{user.name.charAt(0).toUpperCase()}
						</Avatar.Fallback>
					</Avatar>
					<div className="min-w-0 space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="truncate font-bold text-foreground text-xl">
								{user.name}
							</h1>
							<Chip className="font-semibold" color={roleColor} size="sm">
								{roleLabel}
							</Chip>
						</div>
						<p className="truncate text-muted text-xs">{user.email}</p>
						{approvedAreaIds.length > 0 && (
							<div className="flex flex-wrap items-center gap-1.5 pt-1">
								<MapPin className="size-3.5 shrink-0 text-muted" />
								{approvedAreaIds.map((areaId) => {
									const areaName =
										publicAreas?.find((a) => a.id === areaId)?.name ?? areaId;
									return (
										<Chip
											className="font-semibold"
											color="success"
											key={areaId}
											size="sm"
											variant="soft"
										>
											{areaName}
										</Chip>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</Card>

			{/* Profile Edit Card */}
			<Card className="border border-border/40 bg-surface/80 p-4 backdrop-blur-lg">
				<Form className="space-y-4" onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{/* Editable Display Name */}
						<div className="flex flex-col gap-1.5">
							<Label className="flex items-center gap-1.5 font-medium text-foreground text-sm">
								<User className="size-4 text-muted" />
								顯示姓名
							</Label>
							<Input
								className="w-full"
								onChange={(e) => setName(e.target.value)}
								placeholder="請輸入姓名"
								value={name}
							/>
						</div>

						{/* Read-only Email */}
						<div className="flex flex-col gap-1.5">
							<Label className="flex items-center gap-1.5 font-medium text-foreground text-sm">
								<Mail className="size-4 text-muted" />
								電子信箱 (不可更改)
							</Label>
							<Input
								className="w-full bg-background/20"
								disabled
								value={user.email}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 border-separator/20 border-t pt-4 md:grid-cols-2">
						{/* Read-only Role Status */}
						<div className="flex flex-col gap-1.5">
							<Label className="flex items-center gap-1.5 font-medium text-foreground text-sm">
								<Shield className="size-4 text-muted" />
								系統角色與帳號狀態
							</Label>
							<div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/20 p-2.5">
								<Chip
									className="shrink-0 font-semibold"
									color={roleColor}
									size="sm"
								>
									{roleLabel}
								</Chip>
								<Chip
									className="shrink-0 font-semibold"
									color={user.status === "active" ? "success" : "warning"}
									size="sm"
								>
									{user.status === "active" ? "已啟用" : "審核中"}
								</Chip>
							</div>
						</div>

						{/* Editable Area Applications */}
						{!isAdmin && (
							<div className="flex flex-col gap-1.5">
								<Select
									aria-label="所屬營運分會"
									onChange={(keys) => {
										const keysArray = Array.isArray(keys)
											? keys
											: keys
												? [keys]
												: [];
										setSelectedAreaIds(keysArray.map(String));
									}}
									placeholder="選擇所屬分會"
									selectionMode="multiple"
									value={selectedAreaIds}
									variant="secondary"
								>
									<Label className="flex items-center gap-1.5 font-medium text-foreground text-sm">
										所屬營運分會 (可複選)
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
											{(publicAreas ?? []).map((area) => (
												<ListBox.Item
													id={area.id}
													key={area.id}
													textValue={area.name}
												>
													<span className="font-medium text-sm">
														{area.name}
													</span>
													<ListBox.ItemIndicator />
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							</div>
						)}
					</div>

					{/* Live Area Status Section */}
					{!isAdmin && (
						<div className="space-y-2 border-separator/20 border-t pt-4">
							<Label className="flex items-center gap-1.5 font-medium text-foreground text-sm">
								<Info className="size-4 text-muted" />
								目前分會權限審核狀態
							</Label>
							<div className="divide-y divide-separator/20 rounded-2xl border border-border/40 bg-background/40">
								{selectedAreaIds.map((areaId) => {
									const areaObj = publicAreas?.find((a) => a.id === areaId);
									const appObj = myApplications?.find(
										(app) => app.areaId === areaId,
									);

									const status = appObj?.status ?? "new";

									return (
										<div
											className="flex flex-row flex-nowrap items-center justify-between gap-3 p-3"
											key={areaId}
										>
											<div className="flex min-w-0 items-center gap-2">
												{status === "approved" && (
													<div className="shrink-0 rounded-full bg-success-soft/20 p-2 text-success">
														<CheckCircle2 className="size-4" />
													</div>
												)}
												{status === "pending" && (
													<div className="shrink-0 animate-pulse rounded-full bg-warning-soft/20 p-2 text-warning">
														<Clock className="size-4" />
													</div>
												)}
												{status === "rejected" && (
													<div className="shrink-0 rounded-full bg-danger-soft/20 p-2 text-danger">
														<XCircle className="size-4" />
													</div>
												)}
												{status === "new" && (
													<div className="shrink-0 rounded-full bg-primary-soft/20 p-2 text-primary">
														<Plus className="size-4" />
													</div>
												)}
												<div className="min-w-0">
													<h3 className="truncate font-bold text-foreground text-sm">
														{areaObj?.name ?? areaId}
													</h3>
													{status === "rejected" && appObj?.rejectedReason && (
														<p className="mt-0.5 truncate text-danger text-xs">
															退回原因: {appObj.rejectedReason}
														</p>
													)}
												</div>
											</div>

											<div className="shrink-0">
												{status === "approved" && (
													<Chip
														className="font-semibold"
														color="success"
														size="sm"
													>
														已開通
													</Chip>
												)}
												{status === "pending" && (
													<Chip
														className="font-semibold"
														color="warning"
														size="sm"
													>
														審核中
													</Chip>
												)}
												{status === "rejected" && (
													<Chip
														className="font-semibold"
														color="danger"
														size="sm"
													>
														被退回
													</Chip>
												)}
												{status === "new" && (
													<Chip
														className="animate-pulse font-semibold"
														color="accent"
														size="sm"
													>
														待送出申請
													</Chip>
												)}
											</div>
										</div>
									);
								})}
								{selectedAreaIds.length === 0 && (
									<div className="p-4 text-center text-muted text-xs">
										無已選分會，請在上方選擇。
									</div>
								)}
							</div>
						</div>
					)}

					{/* Form Actions */}
					<div className="flex gap-3 border-separator/20 border-t pt-4">
						<Button
							className="flex flex-1 items-center gap-1.5 font-medium"
							onPress={() => router.push("/")}
							variant="secondary"
						>
							<ArrowLeft className="size-4" />
							返回活動管理
						</Button>
						<Button
							className="flex flex-1 items-center gap-1.5 font-bold text-white"
							isDisabled={!isAdmin && selectedAreaIds.length === 0}
							isPending={updateProfileMutation.isPending}
							type="submit"
							variant="primary"
						>
							<Save className="size-4" />
							儲存個人資料
						</Button>
					</div>
				</Form>
			</Card>
		</div>
	);
}
