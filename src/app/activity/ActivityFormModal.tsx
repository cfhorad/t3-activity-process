"use client";

import {
	Alert,
	Button,
	Calendar,

	DateField,
	DatePicker,
	Form,
	Input,
	Label,
	ListBox,
	Modal,
	Select,

	TextArea,
	TextField,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

type Activity = {
	id: string;
	name: string;
	date: string;
	memo: string | null;
	googleSheetId: string | null;
	googleSheetName: string | null;
	handlingMode: string | null;
};

interface ActivityFormModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	activityToEdit?: Activity | null;
}

export function ActivityFormModal({
	isOpen,
	onOpenChange,
	activityToEdit,
}: ActivityFormModalProps) {
	const [isMounted, setIsMounted] = useState(false);
	const [googleSheetId, setGoogleSheetId] = useState("");
	const [googleSheetName, setGoogleSheetName] = useState("");
	const [handlingMode, setHandlingMode] = useState<string>("simple display");
	const [error, setError] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [memo, setMemo] = useState("");

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (isOpen) {
			setError(null);
			if (activityToEdit) {
				setName(activityToEdit.name);
				setMemo(activityToEdit.memo || "");
				setGoogleSheetId(activityToEdit.googleSheetId || "");
				setGoogleSheetName(activityToEdit.googleSheetName || "");
				setHandlingMode(activityToEdit.handlingMode || "simple display");
			} else {
				setName("");
				setMemo("");
				setGoogleSheetId("");
				setGoogleSheetName("");
				setHandlingMode("simple display");
			}
		}
	}, [isOpen, activityToEdit]);

	const { data: sheets, isLoading: isSheetsLoading } =
		api.activity.getGoogleSheetTabs.useQuery(
			{ googleSheetId },
			{ enabled: googleSheetId.length > 5 },
		);



	const utils = api.useUtils();
	const createMutation = api.activity.create.useMutation({
		onSuccess: async () => {
			await utils.activity.getAll.invalidate();
			onOpenChange(false);
		},
		onError: (err) => setError(err.message),
	});
	const updateMutation = api.activity.update.useMutation({
		onSuccess: async () => {
			await utils.activity.getAll.invalidate();
			onOpenChange(false);
		},
		onError: (err) => setError(err.message),
	});

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		const formData = new FormData(e.currentTarget);
		const dateStr = formData.get("date")?.toString();

		if (!name || !dateStr) {
			setError("Name and date are required.");
			return;
		}

		const payload = {
			name,
			date: dateStr,
			memo: memo || undefined,
			googleSheetId: googleSheetId || undefined,
			googleSheetName: googleSheetName || undefined,
			handlingMode: handlingMode || "simple display",
		};

		if (activityToEdit) {
			updateMutation.mutate({
				id: activityToEdit.id,
				...payload,
			});
		} else {
			createMutation.mutate(payload);
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	const defaultDate = activityToEdit?.date
		? parseDate(activityToEdit.date)
		: parseDate(String(new Date().toISOString().split("T")[0]));
	// biome-ignore lint/suspicious/noExplicitAny: type mismatch
	const castedDefaultDate = defaultDate as any;

	if (!isMounted) return null;

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog className="sm:max-w-[500px]">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>
								{activityToEdit ? "Edit Activity" : "Create New Activity"}
							</Modal.Heading>
						</Modal.Header>
						<Form className="w-full" onSubmit={onSubmit}>
							<Modal.Body className="w-full gap-4">
								{error && (
									<Alert status="danger">
										<Alert.Indicator />
										<Alert.Content>
											<Alert.Title>Error</Alert.Title>
											<Alert.Description>{error}</Alert.Description>
										</Alert.Content>
									</Alert>
								)}
								<TextField
									className="w-full"
									isRequired
									name="name"
									onChange={setName}
									value={name}
								>
									<Label>Name</Label>
									<Input placeholder="Activity Name" />
								</TextField>

								<DatePicker
									className="w-full"
									defaultValue={castedDefaultDate}
									isRequired
									name="date"
								>
									<Label>Date</Label>
									<DateField.Group fullWidth>
										<DateField.Input>
											{(segment) => <DateField.Segment segment={segment} />}
										</DateField.Input>
										<DateField.Suffix>
											<DatePicker.Trigger>
												<DatePicker.TriggerIndicator />
											</DatePicker.Trigger>
										</DateField.Suffix>
									</DateField.Group>
									<DatePicker.Popover>
										<Calendar>
											<Calendar.Header>
												<Calendar.YearPickerTrigger>
													<Calendar.YearPickerTriggerHeading />
													<Calendar.YearPickerTriggerIndicator />
												</Calendar.YearPickerTrigger>
												<Calendar.NavButton slot="previous" />
												<Calendar.NavButton slot="next" />
											</Calendar.Header>
											<Calendar.Grid>
												<Calendar.GridHeader>
													{(day) => (
														<Calendar.HeaderCell>{day}</Calendar.HeaderCell>
													)}
												</Calendar.GridHeader>
												<Calendar.GridBody>
													{(d) => <Calendar.Cell date={d} />}
												</Calendar.GridBody>
											</Calendar.Grid>
											<Calendar.YearPickerGrid>
												<Calendar.YearPickerGridBody>
													{({ year }) => (
														<Calendar.YearPickerCell year={year} />
													)}
												</Calendar.YearPickerGridBody>
											</Calendar.YearPickerGrid>
										</Calendar>
									</DatePicker.Popover>
								</DatePicker>

								<TextField
									className="w-full"
									name="memo"
									onChange={setMemo}
									value={memo}
								>
									<Label>Memo</Label>
									<TextArea placeholder="Optional memo..." />
								</TextField>

								<TextField
									className="w-full"
									name="googleSheetId"
									onChange={setGoogleSheetId}
									value={googleSheetId}
								>
									<Label>Google Sheet ID</Label>
									<Input placeholder="Enter Google Sheet ID" />
								</TextField>

								<Select
									className="w-full"
									isDisabled={isSheetsLoading || !sheets || sheets.length === 0}
									name="googleSheetName"
									onSelectionChange={(key) => setGoogleSheetName(String(key))}
									placeholder="Select sheet tab"
									selectedKey={googleSheetName}
								>
									<Label>Google Sheet Name</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox items={sheets || []}>
											{(sheet) => (
												<ListBox.Item id={sheet.title} textValue={sheet.title}>
													{sheet.title}
													<ListBox.ItemIndicator />
												</ListBox.Item>
											)}
										</ListBox>
									</Select.Popover>
								</Select>

								<Select
									className="w-full"
									name="handlingMode"
									onSelectionChange={(key) => setHandlingMode(String(key))}
									selectedKey={handlingMode}
								>
									<Label>Handling Mode</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											<ListBox.Item
												id="simple display"
												textValue="Simple Display"
											>
												Simple Display
												<ListBox.ItemIndicator />
											</ListBox.Item>
											<ListBox.Item id="process" textValue="Process">
												Process
												<ListBox.ItemIndicator />
											</ListBox.Item>
										</ListBox>
									</Select.Popover>
								</Select>
							</Modal.Body>
							<Modal.Footer>
								<Button
									onPress={() => onOpenChange(false)}
									slot="close"
									variant="secondary"
								>
									Cancel
								</Button>
								<Button isPending={isPending} type="submit">
									{activityToEdit ? "Save Changes" : "Create"}
								</Button>
							</Modal.Footer>
						</Form>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
