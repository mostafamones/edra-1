export default function Page({ params }: { params: { subdomain: string } }) {
  return <div>Welcome to academy: {params.subdomain}</div>
}
