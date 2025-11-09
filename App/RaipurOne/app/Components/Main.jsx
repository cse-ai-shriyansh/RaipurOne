import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function Main({ email = '', onLogout = () => {} }) {
	// Editable color scheme - change these to customize the main screen
	const bgColor = 'bg-gradient-to-br from-indigo-50 via-sky-50 to-purple-100';
	const accentColor = 'bg-indigo-600';
	const textColor = 'text-indigo-800';
	const cardBg = 'bg-white';

	return (
		<View className={`flex-1 ${bgColor}`}> 
			{/* Header with RaipurOne branding */}
			<View className="px-4 py-3 border-b border-gray-200">
				<Text className={`text-lg font-bold ${textColor}`}>🏛️ Raipur One</Text>
			</View>

			{/* Main content */}
			<ScrollView className="flex-1 px-4 py-6">
				<View className={`${cardBg} rounded-lg p-6 shadow-sm mb-4`}>
					<Text className={`text-xl font-semibold ${textColor} mb-2`}>
						Welcome! 👋
					</Text>
					<Text className="text-gray-600 text-base">
						Logged in as: {email || 'User'}
					</Text>
				</View>

				{/* Customization Info Card */}
				<View className={`${cardBg} rounded-lg p-4 border-l-4 ${accentColor}`}>
					<Text className="font-semibold text-gray-800 mb-2">
						💡 Customize Your Screen
					</Text>
					<Text className="text-sm text-gray-600">
						Edit the bgColor, accentColor, textColor, and cardBg variables in Main.jsx to change the theme.
					</Text>
				</View>
			</ScrollView>

			{/* Logout button */}
			<View className="px-4 py-4 border-t border-gray-200">
				<TouchableOpacity 
					onPress={onLogout} 
					className={`${accentColor} py-3 rounded-lg items-center`}
				>
					<Text className="text-white font-semibold">Log out</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

