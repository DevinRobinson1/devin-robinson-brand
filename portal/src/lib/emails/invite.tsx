import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components';

export function InviteEmail({ magicLink, workspaceName, inviterName }: {
  magicLink: string; workspaceName: string; inviterName: string | null;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f7f5' }}>
        <Container style={{ padding: '40px', maxWidth: '560px' }}>
          <Heading>You&apos;ve been invited to {workspaceName}</Heading>
          <Text>{inviterName ?? 'A teammate'} added you to the {workspaceName} workspace on the CAIO portal.</Text>
          <Button href={magicLink} style={{ background: '#c45a3c', color: '#fff', padding: '12px 24px', borderRadius: '6px' }}>
            Accept invite
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
