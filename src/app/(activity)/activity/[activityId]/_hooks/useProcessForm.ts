"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
	type ProcessFormData,
	processFormSchema,
} from "../_components/process-form-schema";

export function useProcessForm({
	initialData,
	onSubmit,
	isOpen,
	activityId: _activityId,
}: {
	initialData?: Partial<
		ProcessFormData & {
			iframeSrc?: string | null;
			checkers?: { userId: string }[];
		}
	>;
	onSubmit: (data: ProcessFormData & { iframeSrc: string | null }) => void;
	isOpen: boolean;
	activityId: number;
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
			checkerUserIds: initialData?.checkers?.map((c) => c.userId) ?? [],
		},
	});

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
				checkerUserIds: initialData?.checkers?.map((c) => c.userId) ?? [],
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
			sheetName: data.type === "WEB" ? "WEB" : data.sheetName,
			iframeSrc,
		});
	});

	return {
		form,
		handleSubmit,
		selectedType: form.watch("type"),
	};
}
