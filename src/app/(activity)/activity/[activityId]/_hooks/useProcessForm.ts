"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { api } from "~/trpc/react";
import {
	type ProcessFormData,
	processFormSchema,
} from "../_components/process-form-schema";

export function useProcessForm({
	initialData,
	onSubmit,
	isOpen,
	activityId,
	mode,
}: {
	initialData?: Partial<ProcessFormData & { iframeSrc?: string | null }>;
	onSubmit: (data: any) => void;
	isOpen: boolean;
	activityId: number;
	mode: "create" | "edit";
}) {
	const form = useForm<ProcessFormData>({
		resolver: zodResolver(processFormSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			sheetName: initialData?.sheetName ?? "",
			type: initialData?.type ?? "PROCESS",
			processDate: initialData?.processDate ?? "",
			processMemo: initialData?.processMemo ?? "",
			iframeCode: initialData?.iframeSrc ?? "",
		},
	});

	const { data: activity } = api.activity.getById.useQuery(
		{ id: activityId },
		{ enabled: isOpen },
	);

	const { data: sheetNames, isLoading: isLoadingSheets } =
		api.googleSheet.getSheetMetadata.useQuery(
			{ spreadsheetId: activity?.googleSheetId ?? "" },
			{ enabled: !!activity?.googleSheetId && isOpen },
		);

	// Reset state when initialData changes or modal opens
	useEffect(() => {
		if (isOpen) {
			form.reset({
				name: initialData?.name ?? "",
				sheetName: initialData?.sheetName ?? "",
				type: initialData?.type ?? "PROCESS",
				processDate: initialData?.processDate ?? "",
				processMemo: initialData?.processMemo ?? "",
				iframeCode: initialData?.iframeSrc ?? "",
			});
		}
	}, [initialData, isOpen, form]);

	const handleSubmit = form.handleSubmit((data) => {
		let iframeSrc = initialData?.iframeSrc ?? null;
		if (data.type === "WEB" && data.iframeCode) {
			const srcMatch = data.iframeCode.match(/src="([^"]+)"/);
			iframeSrc = (srcMatch ? srcMatch[1] : data.iframeCode) ?? null;
		}

		onSubmit({
			...data,
			iframeSrc,
		});
	});

	return {
		form,
		handleSubmit,
		sheetNames,
		isLoadingSheets,
		selectedType: form.watch("type"),
	};
}
