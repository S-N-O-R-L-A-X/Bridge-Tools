interface ShowTricksProps {
  tricks: (string | number)[][];
}

export default function ShowTricks(props: ShowTricksProps) {
  const { tricks } = props;
  return (
    <table>
      <tbody>
        {tricks.map((trick) => <tr>{trick.map((t) => <td>{t}</td>)}</tr>)}
      </tbody>
    </table>
  )
}