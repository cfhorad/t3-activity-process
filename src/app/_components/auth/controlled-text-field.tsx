"use client";

import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { useState } from "react";
import {
	type Control,
	Controller,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { EyeIcon, EyeOffIcon } from "./auth-icons";

interface ControlledTextFieldProps<TFieldValues extends FieldValues> {
	control: Control<TFieldValues>;
	name: FieldPath<TFieldValues>;
	label: string;
	placeholder?: string;
	type?: string;
	autoComplete?: string;
	isRequired?: boolean;
	autoFocus?: boolean;
}

export function ControlledTextField<TFieldValues extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	type = "text",
	autoComplete,
	isRequired = true,
	autoFocus = false,
}: ControlledTextFieldProps<TFieldValues>) {
	const [isVisible, setIsVisible] = useState(false);
	const isPassword = type === "password";

	const toggleVisibility = () => setIsVisible(!isVisible);

	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<TextField
					autoComplete={autoComplete}
					autoFocus={autoFocus}
					fullWidth
					isInvalid={!!fieldState.error}
					isRequired={isRequired}
					name={field.name}
					onBlur={field.onBlur}
					onChange={field.onChange}
					type={isPassword && isVisible ? "text" : type}
					value={field.value}
					variant="secondary"
				>
					<Label>{label}</Label>
					<div className="relative flex items-center">
						<Input placeholder={placeholder ?? label} />
						{isPassword && (
							<Button
								className="absolute right-1 size-8 min-w-8 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
								onPress={toggleVisibility}
								type="button"
								variant="ghost"
							>
								{isVisible ? (
									<EyeOffIcon className="size-4" />
								) : (
									<EyeIcon className="size-4" />
								)}
							</Button>
						)}
					</div>
					<FieldError>{fieldState.error?.message}</FieldError>
				</TextField>
			)}
		/>
	);
}
