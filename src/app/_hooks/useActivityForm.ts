"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { extractSpreadsheetId } from "~/utils/google-sheet-parser";
import {
	type ActivityFormData,
	activityFormSchema,
} from "../_components/activity-form-schema";

export function useActivityForm({
	initialData,
	onSubmit,
	isOpen,
}: {
	initialData?: Partial<ActivityFormData>;
	onSubmit: (data: ActivityFormData) => void;
	isOpen: boolean;
}) {
	const [spreadsheetInput, setSpreadsheetInput] = useState(
		initialData?.googleSheetId ?? "",
	);

	const form = useForm<ActivityFormData>({
		resolver: zodResolver(activityFormSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			googleSheetId: initialData?.googleSheetId ?? "",
			activityDate: initialData?.activityDate ?? "",
			areaId: initialData?.areaId ?? "",
			activityMemo: initialData?.activityMemo ?? "",
			leaderUserIds: initialData?.leaderUserIds ?? [],
		},
	});

	// Extract ID when input changes
	useEffect(() => {
		const id = extractSpreadsheetId(spreadsheetInput);
		if (id) {
			form.setValue("googleSheetId", id);
		} else if (spreadsheetInput.length > 0) {
			form.setValue("googleSheetId", spreadsheetInput);
		} else {
			form.setValue("googleSheetId", "");
		}
	}, [spreadsheetInput, form]);

	// Reset state when initialData changes or modal opens
	useEffect(() => {
		if (isOpen) {
			setSpreadsheetInput(initialData?.googleSheetId ?? "");
			form.reset({
				name: initialData?.name ?? "",
				googleSheetId: initialData?.googleSheetId ?? "",
				activityDate: initialData?.activityDate ?? "",
				areaId: initialData?.areaId ?? "",
				activityMemo: initialData?.activityMemo ?? "",
				leaderUserIds: initialData?.leaderUserIds ?? [],
			});
		}
	}, [initialData, isOpen, form]);

	const handleSubmit = form.handleSubmit((data) => {
		onSubmit(data);
	});

	return {
		form,
		spreadsheetInput,
		setSpreadsheetInput,
		handleSubmit,
		isSubmittable: !!form.watch("googleSheetId"),
	};
}
