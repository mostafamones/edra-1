export default function Page({ params }: { params: { slug: string } }) {
  return <div>Welcome to academy: {params.slug}</div>
}
