"use client";

import Header from "../components/header/header";
import Footer from "../components/footer/footer";
import PageGuard from "../components/pageguard/page";
import {
	Upload,
	FileText,
	AlertCircle,
	Save,
	X,
	Trash2,
	CheckCircle2,
	User,
	Calendar,
} from "lucide-react";
import { useRef } from "react";
import { Space_Mono } from "next/font/google";

export default function CreateAccountPage() {
	const dateInputRef = useRef<HTMLInputElement>(null);
	return (
		<PageGuard>
			<div className="min-h-screen bg-white flex flex-col">
				<Header />
				<main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
					<form className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
						<div className="flex items-center gap-2 mb-4 text-gray-900">
							<User size={20} />
							<h2 className="text-lg font-bold">Create Worker Account</h2>
						</div>

						<div className="space-y-2">
							<div>
								<label className="block text-xs font-semibold text-gray-700 mb-1">
									FIRST NAME
								</label>
								<input
									type="text"
									className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="First Name"
								/>
							</div>
							<div>
								<label className="block text-xs font-semibold text-gray-700 mb-1">
									MIDDLE NAME
								</label>
								<span className="text-gray-400 text-xs">Optional</span>
								<input
									type="text"
									className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="Middle Name"
								/>
							</div>
							<div>
								<label className="block text-xs font-semibold text-gray-700 mb-1">
									LAST NAME
								</label>
								<input
									type="text"
									className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="Last Name"
								/>
							</div>

							<div>
								<label className="block text-xs font-semibold text-gray-700 mb-1">
									DATE CREATED
								</label>
								<div
									className="relative cursor-pointer"
									onClick={() => dateInputRef.current?.showPicker()}
								>
									<Calendar
										size={18}
										className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
									/>
									<input
										ref={dateInputRef}
										type="date"
										max="2099-12-31"
										onKeyDown={(e) => e.preventDefault()}
										className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-2.5 pl-10 text-sm focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
									/>
								</div>
							</div>
						</div>
						<button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition hover:cursor-pointer">
							Create Account
						</button>
					</form>
				</main>
				<Footer />
			</div>
		</PageGuard>
	);
}


// const admin = await auth.api.createUser({
//     body: {
//       email: 'jdsantos@staff.internal',
//       password: 'AdminPass123!',
//       name: 'Juan Santos',
//       role: 'admin',
//       data: {
//         firstName: 'Juan',
//         middleName: 'Dela',
//         lastName: 'Santos',
//         jobRole: 'admin',
//         contactNumber: '09171234567',
//         username: 'jdsantos',
//       },
//     },
//   });