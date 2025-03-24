import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Set the admin token
pb.authStore.save(process.env.POCKETBASE_ADMIN_TOKEN || '');

async function handleUserCreated(user: any) {
  try {
    // Validate required fields according to the rules
    if (!user.first_name || !user.last_name || !user.id || !user.email_addresses?.[0]?.email_address) {
      console.error('Missing required fields for user creation');
      return;
    }

    const data = {
      first_name: user.first_name,
      last_name: user.last_name,
      clerk_id: user.id,
      username: user.username || user.first_name.toLowerCase(),
      phone_client: user.phone_numbers?.[0]?.phone_number || null,
      session_id: null,
      email: user.email_addresses[0].email_address,
      user_id: user.id
    };

    // Verify if a user with the same clerk_id already exists
    try {
      const existingUser = await pb.collection('clients').getFirstListItem(`clerk_id = "${user.id}"`);
      if (existingUser) {
        console.log('User already exists:', existingUser);
        return;
      }
    } catch (error) {
      // If no user found, proceed with creation
      console.log('Creating new client in PocketBase:', data);
      const record = await pb.collection('clients').create(data);
      console.log('Client created successfully:', record);
    }

  } catch (error: any) {
    console.error('Error creating user in PocketBase:', error);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

async function handleOrganizationCreated(org: any) {
  try {
    // Guardar la organización
    const orgData = {
      clerk_id: org.id,
      name: org.name,
      slug: org.slug
    };

    console.log('Creando organización en PocketBase:', orgData);
    const orgRecord = await pb.collection('organizations').create(orgData);
    console.log('Organización creada exitosamente:', orgRecord);

    if (org.created_by) {
      // Buscar el ID interno de la organización que acabamos de crear
      const organization = await pb.collection('organizations').getFirstListItem(`clerk_id = "${org.id}"`);
      
      // Buscar el ID interno del usuario creador
      const user = await pb.collection('clients').getFirstListItem(`user_id = "${org.created_by}"`);
      
      // Crear la membresía para el creador de la organización
      const membershipData = {
        clerk_id: `${org.id}_${org.created_by}`,
        organization_id: organization.id,
        user_id: user.id,
        role: 'admin'
      };

      console.log('Creando membresía del creador en PocketBase:', membershipData);
      const membershipRecord = await pb.collection('organization_memberships').create(membershipData);
      console.log('Membresía del creador creada exitosamente:', membershipRecord);
    }
  } catch (error) {
    console.error('Error en el proceso de creación de organización:', error);
  }
}

async function getOrCreateOrganization(orgData: any) {
  try {
    // Intentar obtener la organización existente
    return await pb.collection('organizations').getFirstListItem(`clerk_id = "${orgData.id}"`);
  } catch (error) {
    // Si no existe, crearla
    console.log('Creando nueva organización:', orgData.name);
    return await pb.collection('organizations').create({
      clerk_id: orgData.id,
      name: orgData.name,
      slug: orgData.slug,
      created: new Date(orgData.created_at).toISOString(),
      updated: new Date(orgData.updated_at).toISOString(),
    });
  }
}

async function getOrCreateUser(userData: any) {
  try {
    // Intentar obtener el usuario existente
    return await pb.collection('clients').getFirstListItem(`user_id = "${userData.user_id}"`);
  } catch (error) {
    // Si no existe, crearlo
    console.log('Creando nuevo usuario:', userData.identifier);
    return await pb.collection('clients').create({
      user_id: userData.user_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.identifier,
      platform: 'default',
      created: new Date().toISOString(),
    });
  }
}

async function handleOrganizationMembershipCreated(membership: any) {
  try {
    console.log('Procesando nueva membresía de organización');

    // Obtener o crear la organización
    const organization = await getOrCreateOrganization(membership.organization);
    console.log('Organización asegurada:', organization.id);

    // Obtener o crear el usuario
    const user = await getOrCreateUser(membership.public_user_data);
    console.log('Usuario asegurado:', user.id);

    // Verificar si la membresía ya existe
    try {
      const existingMembership = await pb.collection('organization_memberships').getFirstListItem(
        `clerk_id = "${membership.id}"`
      );
      console.log('La membresía ya existe:', existingMembership.id);
      return existingMembership;
    } catch (error) {
      // Si no existe, crear la nueva membresía
      console.log('Creando nueva membresía');
      const membershipData = {
        clerk_id: membership.id,
        organization_id: organization.id,
        user_id: user.id,
        role: membership.role === 'org:admin' ? 'admin' : 'member',
        permissions: JSON.stringify(membership.permissions),
        created: new Date(membership.created_at).toISOString(),
        updated: new Date(membership.updated_at).toISOString(),
      };

      const membershipRecord = await pb.collection('organization_memberships').create(membershipData);
      console.log('Membresía creada exitosamente:', membershipRecord.id);
      return membershipRecord;
    }
  } catch (error) {
    console.error('Error detallado en handleOrganizationMembershipCreated:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }
 
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");
 
  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }
 
  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);
 
  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);
 
  let evt: WebhookEvent;
 
  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }
 
  // Handle the webhook
  const eventType = evt.type;
  
  console.log(`Webhook received! Event type: ${eventType}`);
  console.log('Webhook data:', JSON.stringify(evt.data, null, 2));

  switch (eventType) {
    case 'user.created':
      await handleUserCreated(evt.data);
      break;
    case 'organization.created':
      await handleOrganizationCreated(evt.data);
      break;
    case 'organizationMembership.created':
      await handleOrganizationMembershipCreated(evt.data);
      break;
  }
 
  return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
} 