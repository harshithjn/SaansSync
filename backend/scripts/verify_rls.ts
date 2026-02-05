
/// <reference types="node" />
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

// Decode JWT simply to check role
const decodeJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return { error: 'Invalid JWT' };
    }
};

const payload = decodeJwt(key);
console.log('Service Role Key Payload:', payload);

if (payload.role !== 'service_role') {
    console.error('FATAL: The configured SUPABASE_SERVICE_ROLE_KEY does NOT have "service_role". It has:', payload.role);
} else {
    console.log('CONFIRMED: Key has "service_role"');
}

const supabase = createClient(url, key, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testInsert() {
    console.log('Attempting to insert a test message...');
    const { data, error } = await supabase
        .from('messages')
        .insert([{
            patient_id: '14f5a404-d8c1-4d3e-8d29-11b6dc648fa2', // Using ID from user logs
            sender_role: 'patient',
            content: 'Debug message from script env verification'
        }])
        .select()
        .single();

    if (error) {
        console.error('INSERT FAILED:', error);
    } else {
        console.log('INSERT SUCCESS:', data);
        // Clean up
        await supabase.from('messages').delete().eq('id', data.id);
    }
}

testInsert();
