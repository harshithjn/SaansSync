import { supabaseAdmin } from '../config/supabaseClient';

export interface CreateMessageData {
    patient_id: string;
    doctor_id?: string;
    sender_role: 'patient' | 'doctor';
    content: string;
}

export const sendMessage = async (data: CreateMessageData) => {
    if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
    console.log('Sending message with data:', JSON.stringify(data, null, 2));

    // Check if we are really admin
    // Note: getSession() is async but we don't need to await it just to inspect the object structure usually, 
    // but let's just log a marker.
    console.log('Using supabaseAdmin to insert...');

    const { data: message, error } = await supabaseAdmin
        .from('messages')
        .insert([data])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return message;
};

export const getConversation = async (patientId: string) => {
    if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');

    const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return messages;
};

export const getDoctorConversations = async (doctorId: string) => {
    if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
    // Get distinct patients who have messaged
    // This is a bit complex in pure Supabase JS if we want latest message per patient
    // For simplicity, we fetch all relevant messages and group them in application logic or simple query
    // Ideally, we'd use a view or a more complex query.
    // For now, let's fetch messages where doctor_id matches OR messages from patients assigned to this doctor

    // Assuming strict assignment isn't always there, we look for messages involving this doctor
    // or generally fetch all for now if it's a small app, but let's try to be specific.

    // Strategy: Get threads grouped by patient_id
    const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('*, patient:patients(full_name, id)')
        .or(`doctor_id.eq.${doctorId},sender_role.eq.patient`) // Show patient messages to doctor
        .order('created_at', { ascending: false });

    if (error) throw error;
    return messages;
};

export const markAsRead = async (messageIds: string[]) => {
    if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');

    const { error } = await supabaseAdmin
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds);

    if (error) throw error;
};
