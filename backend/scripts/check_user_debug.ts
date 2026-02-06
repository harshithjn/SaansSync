
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../backend/.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseServiceKey)

async function checkUser(emailOrPhone: string) {
    console.log(`Checking user: ${emailOrPhone}`)

    // 1. Check Auth User by Email
    const { data: { users }, error } = await admin.auth.admin.listUsers()

    if (error) {
        console.error('List users failed:', error)
        return
    }

    const user = users.find(u => u.email === emailOrPhone || u.phone?.includes(emailOrPhone.replace('+', '')))

    if (!user) {
        console.log('❌ User NOT found in auth.users')
    } else {
        console.log('✅ User FOUND in auth.users:', {
            id: user.id,
            email: user.email,
            phone: user.phone,
            email_confirmed_at: user.email_confirmed_at,
            phone_confirmed_at: user.phone_confirmed_at,
            role: user.role,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata
        })
    }

    // 2. Check Doctor Profile
    let profileQuery = admin.from('doctors').select('*')

    if (emailOrPhone.includes('@')) {
        profileQuery = profileQuery.eq('email', emailOrPhone)
    } else {
        // try formatting phone
        const clean = emailOrPhone.replace(/\D/g, '')
        profileQuery = profileQuery.eq('phone', clean)
    }

    const { data: profile, error: dbError } = await profileQuery.single()

    if (dbError) {
        console.log('❌ Profile NOT found in doctors table:', dbError.message)
    } else {
        console.log('✅ Profile FOUND in doctors table:', profile)
    }
}

const target = process.argv[2] || 'mohammedbilal96654@gmail.com'
checkUser(target)
