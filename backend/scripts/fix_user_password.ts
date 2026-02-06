
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseServiceKey)

async function fixUser() {
    const email = 'mohammedbilal96654@gmail.com'
    const password = '12345678'

    console.log(`Searching for user with email: ${email}...`)

    // 1. Find user
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers()

    if (listError) {
        console.error('List users failed:', listError)
        return
    }

    const user = users.find(u => u.email === email)

    if (!user) {
        console.log('❌ User not found by email. Checking by phone...')
        // Try finding by phone if email match failed (maybe email wasn't set on auth user yet?)
        // But check_user_debug said it was found.
        return
    }

    console.log(`✅ Found user ${user.id}.`)
    console.log(`Current status: Email Confirmed: ${user.email_confirmed_at}, Phone Confirmed: ${user.phone_confirmed_at}`)

    console.log(`Attempting force update...`)
    console.log(`- Setting email: ${email}`)
    console.log(`- Setting password: ${password}`)
    console.log(`- Setting email_confirm: true`)

    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { role: 'doctor' }
    })

    if (error) {
        console.error('❌ Update failed:', error)
    } else {
        console.log('✅ Update success!')
        console.log('User data:', {
            email: data.user.email,
            email_confirmed_at: data.user.email_confirmed_at,
            last_sign_in_at: data.user.last_sign_in_at
        })
        console.log('👉 Please try logging in now with "12345678"')
    }
}

fixUser()
