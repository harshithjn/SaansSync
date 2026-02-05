
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, supabaseServiceKey)

async function fix() {
    console.log('Fixing patient auth...')

    // Target email
    const email = 'mohammedbilal96654@gmail.com'
    const password = 'patient123'

    // 1. Check if Auth User exists
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
    let user = users.find(u => u.email === email)

    if (user) {
        console.log(`Auth User found: ${user.id}`)
        // Update password just in case
        await admin.auth.admin.updateUserById(user.id, { password: password, email_confirm: true })
        console.log('Password reset to patient123')
    } else {
        console.log('Creating new Auth User...')
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'patient' }
        })
        if (createError) {
            console.error('Failed to create user:', createError)
            return
        }
        user = newUser.user
        console.log(`Auth User created: ${user!.id}`)
    }

    // 2. Link to Patient Profile
    if (user) {
        const { error: updateError } = await admin
            .from('patients')
            .update({ auth_user_id: user.id })
            .eq('email', email)

        if (updateError) {
            console.error('Failed to update patient profile:', updateError)
        } else {
            console.log('SUCCESS: Linked Auth User to Patient Profile.')
        }
    }
}

fix()
